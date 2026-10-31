import { AppDataSource } from '../../createConnection';
import MerchProvider from '../../enum/MerchProvider';
import EmailService from '../email/EmailService';
import { onShipmentSent } from './MerchOrderService';

jest.mock('../email/EmailService', () => ({
  __esModule: true,
  default: { sendTemplateEmail: jest.fn() },
}));

const mockSendTemplateEmail = jest.mocked(EmailService.sendTemplateEmail);
const SENT = { messageId: 'm', statusMessage: 'OK', code: 0 };

jest.mock('../users/UserService', () => ({
  getUser: jest.fn(() =>
    Promise.resolve({ id: 1, email: 'shopper@example.com' })
  ),
  createMagicLinkUrl: jest.fn(() => 'http://dev.1940s.nyc:3000/orders'),
}));

// Pulled in by the fulfillment providers, neither is used by onShipmentSent.
jest.mock('../utils/printfulApi', () => ({}));

interface FakeOrder {
  id: number;
  providerOrderId: string;
  trackingUrl: string | null;
  emailedTrackingUrl: string | null;
}

interface FakeStore {
  rows: FakeOrder[];
  addOrder(providerOrderId: string): FakeOrder;
  failNextUpdate(): void;
}

// The claim is one conditional UPDATE, so the fake only has to model that statement: match the
// conditions, assign on a hit, report the row count.
jest.mock('../../createConnection', () => {
  const rows: FakeOrder[] = [];
  let nextId = 1;
  let failNextUpdate = false;

  const condition = (sql: string, params: { trackingUrl?: string }) => {
    if (sql === 'emailedTrackingUrl IS DISTINCT FROM :trackingUrl') {
      return (row: FakeOrder) => row.emailedTrackingUrl !== params.trackingUrl;
    }
    if (sql === 'emailedTrackingUrl = :trackingUrl') {
      return (row: FakeOrder) => row.emailedTrackingUrl === params.trackingUrl;
    }
    throw new Error(`Unexpected condition: ${sql}`);
  };

  const repository = {
    findOneBy: ({
      providerOrderId,
    }: {
      providerOrderId: string;
    }): Promise<FakeOrder | null> =>
      Promise.resolve(
        rows.find((r) => r.providerOrderId === providerOrderId) ?? null
      ),
    createQueryBuilder: () => {
      let row: FakeOrder | undefined;
      let patch: Partial<FakeOrder> = {};
      const conditions: Array<(r: FakeOrder) => boolean> = [];
      const builder = {
        update: () => builder,
        set: (values: Partial<FakeOrder>) => {
          patch = values;
          return builder;
        },
        where: (criteria: { id: number }) => {
          row = rows.find((r) => r.id === criteria.id);
          return builder;
        },
        andWhere: (sql: string, params: { trackingUrl?: string }) => {
          conditions.push(condition(sql, params));
          return builder;
        },
        execute: (): Promise<{ affected: number }> => {
          if (failNextUpdate) {
            failNextUpdate = false;
            return Promise.reject(new Error('the database is unreachable'));
          }
          const target = row;
          if (!target || !conditions.every((c) => c(target))) {
            return Promise.resolve({ affected: 0 });
          }
          Object.assign(target, patch);
          return Promise.resolve({ affected: 1 });
        },
      };
      return builder;
    },
  };

  const store: FakeStore = {
    rows,
    addOrder(providerOrderId: string) {
      const row: FakeOrder = {
        id: nextId++,
        providerOrderId,
        trackingUrl: null,
        emailedTrackingUrl: null,
      };
      rows.push(row);
      return row;
    },
    failNextUpdate() {
      failNextUpdate = true;
    },
  };

  return {
    AppDataSource: { getRepository: () => repository, __store: store },
    default: () => Promise.resolve(),
  };
});

const store = (AppDataSource as unknown as { __store: FakeStore }).__store;

const URL_ONE = 'https://track.example/one';
const URL_TWO = 'https://track.example/two';

function addOrder(providerOrderId: string): FakeOrder {
  return store.addOrder(providerOrderId);
}

beforeEach(() => {
  store.rows.length = 0;
  mockSendTemplateEmail.mockReset();
  mockSendTemplateEmail.mockResolvedValue(SENT);
});

it('retries the shipped email after a failed send, then leaves a replay alone', async () => {
  const order = addOrder('ord_retry');
  mockSendTemplateEmail.mockRejectedValueOnce(new Error('postmark is down'));

  await expect(
    onShipmentSent(MerchProvider.PRODIGI, 'ord_retry', URL_ONE)
  ).rejects.toThrow('postmark is down');
  expect(order.trackingUrl).toBe(URL_ONE);
  expect(order.emailedTrackingUrl).toBeNull();
  expect(mockSendTemplateEmail).toHaveBeenCalledTimes(1);

  await onShipmentSent(MerchProvider.PRODIGI, 'ord_retry', URL_ONE);
  expect(order.emailedTrackingUrl).toBe(URL_ONE);
  expect(mockSendTemplateEmail).toHaveBeenCalledTimes(2);

  await onShipmentSent(MerchProvider.PRODIGI, 'ord_retry', URL_ONE);
  expect(order.emailedTrackingUrl).toBe(URL_ONE);
  expect(mockSendTemplateEmail).toHaveBeenCalledTimes(2);
});

it('sends one email when two callers report the same shipment at once', async () => {
  const order = addOrder('ord_race');
  mockSendTemplateEmail.mockImplementation(
    () => new Promise((resolve) => setTimeout(() => resolve(SENT), 50))
  );

  await Promise.all([
    onShipmentSent(MerchProvider.PRODIGI, 'ord_race', URL_ONE),
    onShipmentSent(MerchProvider.PRODIGI, 'ord_race', URL_ONE),
  ]);

  expect(mockSendTemplateEmail).toHaveBeenCalledTimes(1);
  expect(order.emailedTrackingUrl).toBe(URL_ONE);
});

it('emails again for a later shipment and moves the marker', async () => {
  const order = addOrder('ord_two');

  await onShipmentSent(MerchProvider.PRODIGI, 'ord_two', URL_ONE);
  await onShipmentSent(MerchProvider.PRODIGI, 'ord_two', URL_TWO);

  expect(mockSendTemplateEmail).toHaveBeenCalledTimes(2);
  expect(order.trackingUrl).toBe(URL_TWO);
  expect(order.emailedTrackingUrl).toBe(URL_TWO);
});

it('releases the claim when a later send fails, and retries it', async () => {
  const order = addOrder('ord_later_fail');

  await onShipmentSent(MerchProvider.PRODIGI, 'ord_later_fail', URL_ONE);
  mockSendTemplateEmail.mockRejectedValueOnce(new Error('postmark is down'));
  await expect(
    onShipmentSent(MerchProvider.PRODIGI, 'ord_later_fail', URL_TWO)
  ).rejects.toThrow('postmark is down');

  expect(order.trackingUrl).toBe(URL_TWO);
  expect(order.emailedTrackingUrl).toBeNull();

  await onShipmentSent(MerchProvider.PRODIGI, 'ord_later_fail', URL_TWO);
  expect(order.emailedTrackingUrl).toBe(URL_TWO);
  expect(mockSendTemplateEmail).toHaveBeenCalledTimes(3);
});

it("does not clobber a newer shipment's marker when an earlier send fails", async () => {
  const order = addOrder('ord_overlap');
  let failFirstSend: (error: Error) => void = () => undefined;
  mockSendTemplateEmail.mockImplementationOnce(
    () =>
      new Promise((_resolve, reject) => {
        failFirstSend = reject;
      })
  );

  const firstSend = onShipmentSent(
    MerchProvider.PRODIGI,
    'ord_overlap',
    URL_ONE
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  await onShipmentSent(MerchProvider.PRODIGI, 'ord_overlap', URL_TWO);
  expect(order.emailedTrackingUrl).toBe(URL_TWO);

  failFirstSend(new Error('postmark is down'));
  await expect(firstSend).rejects.toThrow('postmark is down');
  expect(order.emailedTrackingUrl).toBe(URL_TWO);
});

it('propagates the send error even when clearing the write fails', async () => {
  addOrder('ord_release_fail');
  const reported = jest
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);
  mockSendTemplateEmail.mockImplementation(() => {
    store.failNextUpdate();
    return Promise.reject(new Error('postmark is down'));
  });

  await expect(
    onShipmentSent(MerchProvider.PRODIGI, 'ord_release_fail', URL_ONE)
  ).rejects.toThrow('postmark is down');
  expect(reported).toHaveBeenCalledWith(
    '[merch] Failed to clear the emailed tracking link',
    new Error('the database is unreachable')
  );
  reported.mockRestore();
});
