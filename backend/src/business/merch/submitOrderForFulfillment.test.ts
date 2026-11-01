import { AppDataSource } from '../../createConnection';
import MerchOrderState from '../../enum/MerchOrderState';
import MerchProvider from '../../enum/MerchProvider';
import { submitOrderForFulfillment } from './MerchOrderService';

jest.mock('../email/EmailService', () => ({
  __esModule: true,
  default: { sendTemplateEmail: jest.fn() },
}));

jest.mock('../users/UserService', () => ({
  getUser: jest.fn(() => Promise.resolve({ id: 1 })),
  createMagicLinkUrl: jest.fn(() => 'http://dev.1940s.nyc:3000/orders'),
}));

jest.mock('../utils/printfulApi', () => ({}));

const submitOrderForFulfillmentToProvider = jest.fn();
const cancelSubmittedOrderOnProvider = jest.fn();

jest.mock('./providers/getFulfillmentProvider', () => ({
  __esModule: true,
  default: () => ({
    submitOrderForFulfillment: submitOrderForFulfillmentToProvider,
    cancelSubmittedOrder: cancelSubmittedOrderOnProvider,
  }),
  selectProviderForItems: () => 'prodigi',
}));

interface FakeOrder {
  id: number;
  provider: MerchProvider;
  state: MerchOrderState;
  providerOrderId: string | null;
}

// Models only what submitOrderForFulfillment uses: a conditional UPDATE is a match on the where
// criteria followed by a patch, and the affected count is how many rows matched.
jest.mock('../../createConnection', () => {
  const rows: FakeOrder[] = [];

  const repository = {
    findOneByOrFail: ({ id }: { id: number }): Promise<FakeOrder> => {
      const row = rows.find((r) => r.id === id);
      return row
        ? Promise.resolve(row)
        : Promise.reject(new Error(`no order ${id}`));
    },
    update: (
      id: number,
      patch: Partial<FakeOrder>
    ): Promise<{ affected: number }> => {
      const row = rows.find((r) => r.id === id);
      if (!row) {
        return Promise.resolve({ affected: 0 });
      }
      Object.assign(row, patch);
      return Promise.resolve({ affected: 1 });
    },
    createQueryBuilder: () => {
      let criteria: Partial<FakeOrder> = {};
      let patch: Partial<FakeOrder> = {};
      const builder = {
        update: () => builder,
        set: (values: Partial<FakeOrder>) => {
          patch = values;
          return builder;
        },
        where: (values: Partial<FakeOrder>) => {
          criteria = values;
          return builder;
        },
        execute: (): Promise<{ affected: number }> => {
          const matches = rows.filter((row) =>
            Object.entries(criteria).every(
              ([key, value]) => row[key as keyof FakeOrder] === value
            )
          );
          for (const row of matches) {
            Object.assign(row, patch);
          }
          return Promise.resolve({ affected: matches.length });
        },
      };
      return builder;
    },
  };

  return {
    AppDataSource: {
      getRepository: () => repository,
      __rows: rows,
    },
    default: () => Promise.resolve(),
  };
});

const rows = (AppDataSource as unknown as { __rows: FakeOrder[] }).__rows;

function addOrder(state: MerchOrderState): FakeOrder {
  const row: FakeOrder = {
    id: rows.length + 1,
    provider: MerchProvider.PRODIGI,
    state,
    providerOrderId: null,
  };
  rows.push(row);
  return row;
}

beforeEach(() => {
  rows.length = 0;
  submitOrderForFulfillmentToProvider.mockReset();
  submitOrderForFulfillmentToProvider.mockResolvedValue({
    providerOrderId: 'prodigi_1',
  });
  cancelSubmittedOrderOnProvider.mockReset();
  cancelSubmittedOrderOnProvider.mockResolvedValue(undefined);
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

it('does not reach the printer for an order canceled before submission', async () => {
  const order = addOrder(MerchOrderState.CANCELED);

  await submitOrderForFulfillment(order.id);

  expect(submitOrderForFulfillmentToProvider).not.toHaveBeenCalled();
  expect(order.state).toBe(MerchOrderState.CANCELED);
  expect(order.providerOrderId).toBeNull();
});

it('does not reach the printer for an order that is already submitted', async () => {
  const order = addOrder(MerchOrderState.SUBMITTED_FOR_FULFILLMENT);

  await submitOrderForFulfillment(order.id);

  expect(submitOrderForFulfillmentToProvider).not.toHaveBeenCalled();
  expect(order.state).toBe(MerchOrderState.SUBMITTED_FOR_FULFILLMENT);
});

it('submits a pending order and records the printer id', async () => {
  const order = addOrder(MerchOrderState.PENDING_SUBMISSION);

  await submitOrderForFulfillment(order.id);

  expect(submitOrderForFulfillmentToProvider).toHaveBeenCalledTimes(1);
  expect(order.state).toBe(MerchOrderState.SUBMITTED_FOR_FULFILLMENT);
  expect(order.providerOrderId).toBe('prodigi_1');
});

it('calls the printer once when two submitters race for the same order', async () => {
  const order = addOrder(MerchOrderState.PENDING_SUBMISSION);
  let release: () => void = () => undefined;
  submitOrderForFulfillmentToProvider.mockImplementation(
    () =>
      new Promise((resolve) => {
        release = () => resolve({ providerOrderId: 'prodigi_1' });
      })
  );

  const first = submitOrderForFulfillment(order.id);
  await new Promise((resolve) => setTimeout(resolve, 0));
  await submitOrderForFulfillment(order.id);
  release();
  await first;

  expect(submitOrderForFulfillmentToProvider).toHaveBeenCalledTimes(1);
  expect(order.state).toBe(MerchOrderState.SUBMITTED_FOR_FULFILLMENT);
});

it('releases the claim so a failed submission is retried', async () => {
  const order = addOrder(MerchOrderState.PENDING_SUBMISSION);
  submitOrderForFulfillmentToProvider.mockRejectedValueOnce(
    new Error('prodigi is down')
  );

  await expect(submitOrderForFulfillment(order.id)).rejects.toThrow(
    'prodigi is down'
  );
  expect(order.state).toBe(MerchOrderState.PENDING_SUBMISSION);

  await submitOrderForFulfillment(order.id);
  expect(submitOrderForFulfillmentToProvider).toHaveBeenCalledTimes(2);
  expect(order.state).toBe(MerchOrderState.SUBMITTED_FOR_FULFILLMENT);
});

it('cancels at the printer when the order is canceled mid-submission', async () => {
  const order = addOrder(MerchOrderState.PENDING_SUBMISSION);
  const error = jest
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);
  submitOrderForFulfillmentToProvider.mockImplementation(() => {
    order.state = MerchOrderState.CANCELED;
    return Promise.resolve({ providerOrderId: 'prodigi_1' });
  });

  await submitOrderForFulfillment(order.id);

  expect(order.state).toBe(MerchOrderState.CANCELED);
  expect(order.providerOrderId).toBe('prodigi_1');
  expect(cancelSubmittedOrderOnProvider).toHaveBeenCalledTimes(1);
  expect(error).not.toHaveBeenCalled();
});

it('raises when the printer cannot cancel an order canceled mid-submission', async () => {
  const order = addOrder(MerchOrderState.PENDING_SUBMISSION);
  const error = jest
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);
  submitOrderForFulfillmentToProvider.mockImplementation(() => {
    order.state = MerchOrderState.CANCELED;
    return Promise.resolve({ providerOrderId: 'prodigi_1' });
  });
  cancelSubmittedOrderOnProvider.mockRejectedValue(new Error('too late'));

  await submitOrderForFulfillment(order.id);

  expect(order.state).toBe(MerchOrderState.CANCELED);
  expect(order.providerOrderId).toBe('prodigi_1');
  expect(error).toHaveBeenCalledWith(
    expect.stringContaining('order 1 was canceled')
  );
});
