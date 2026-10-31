import MerchOrder from '../../entities/MerchOrder';
import MerchShipment from '../../entities/MerchShipment';
import MerchProvider from '../../enum/MerchProvider';
import EmailService from '../email/EmailService';
import * as UserService from '../users/UserService';
import { onShipmentSent } from './MerchOrderService';

const orders = { findOneBy: jest.fn(), save: jest.fn() };
const shipments = {
  upsert: jest.fn(),
  findOneByOrFail: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
};

jest.mock('../../createConnection', () => ({
  AppDataSource: {
    getRepository: (entity: unknown) =>
      entity === MerchShipment ? shipments : orders,
  },
}));
jest.mock('./providers/getFulfillmentProvider', () => ({}));
jest.mock('../users/UserService', () => ({
  getUser: jest.fn().mockResolvedValue({ id: 1, email: 'a@b.c' }),
  createMagicLinkUrl: jest.fn().mockReturnValue(new URL('http://x/orders')),
}));
jest.mock('../email/EmailService', () => ({
  __esModule: true,
  default: { sendTemplateEmail: jest.fn() },
}));
jest.mock('../email/templates/OrderShippedTemplate', () => ({
  __esModule: true,
  default: { createTemplatedEmail: jest.fn((e: unknown) => e) },
}));
jest.mock('../email/templates/OrderCustomizeTemplate', () => ({}));

const sendEmail = jest.mocked(EmailService.sendTemplateEmail);

describe('onShipmentSent', () => {
  let order: MerchOrder;
  const shipment = {
    id: 11,
    orderId: 5,
    providerShipmentId: 's1',
    trackingUrl: 'http://track/1',
  } as MerchShipment;
  const info = { providerShipmentId: 's1', trackingUrl: 'http://track/1' };

  beforeEach(() => {
    jest.resetAllMocks();
    order = { id: 5, userId: 1 } as MerchOrder;
    orders.findOneBy.mockResolvedValue(order);
    orders.save.mockImplementation((o: unknown) => Promise.resolve(o));
    shipments.upsert.mockResolvedValue(undefined);
    shipments.findOneByOrFail.mockResolvedValue(shipment);
    shipments.findOne.mockResolvedValue(shipment);
    shipments.update.mockResolvedValue({ affected: 1 });
    jest.mocked(UserService.getUser).mockResolvedValue({
      id: 1,
      email: 'a@b.c',
    } as never);
    jest
      .mocked(UserService.createMagicLinkUrl)
      .mockReturnValue(new URL('http://x/orders'));
  });

  it('records a new shipment, updates the order tracking url and emails once', async () => {
    await onShipmentSent(MerchProvider.PRINTFUL, '9', info);
    expect(shipments.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 5,
        providerShipmentId: 's1',
        trackingUrl: 'http://track/1',
      }),
      ['orderId', 'providerShipmentId']
    );
    expect(orders.save).toHaveBeenCalledWith(
      expect.objectContaining({ trackingUrl: 'http://track/1' })
    );
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('does not email when another delivery already claimed the email', async () => {
    shipments.update.mockResolvedValue({ affected: 0 });
    await onShipmentSent(MerchProvider.PRINTFUL, '9', info);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('releases the claim and rethrows when sending fails, so a retry resends', async () => {
    sendEmail.mockRejectedValueOnce(new Error('postmark down'));
    await expect(
      onShipmentSent(MerchProvider.PRINTFUL, '9', info)
    ).rejects.toThrow('postmark down');
    expect(shipments.update).toHaveBeenLastCalledWith(
      { id: 11 },
      { emailedAt: null }
    );

    shipments.update.mockResolvedValue({ affected: 1 });
    await onShipmentSent(MerchProvider.PRINTFUL, '9', info);
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  it('releases the claim when the user lookup fails', async () => {
    jest.mocked(UserService.getUser).mockRejectedValueOnce(new Error('db'));
    await expect(
      onShipmentSent(MerchProvider.PRINTFUL, '9', info)
    ).rejects.toThrow('db');
    expect(shipments.update).toHaveBeenLastCalledWith(
      { id: 11 },
      { emailedAt: null }
    );
  });

  it('converges concurrent deliveries on one row and one email', async () => {
    let claimed = false;
    shipments.update.mockImplementation(() => {
      const affected = claimed ? 0 : 1;
      claimed = true;
      return Promise.resolve({ affected });
    });
    await Promise.all([
      onShipmentSent(MerchProvider.PRINTFUL, '9', info),
      onShipmentSent(MerchProvider.PRINTFUL, '9', info),
    ]);
    expect(shipments.upsert).toHaveBeenCalledTimes(2);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('does not move order.trackingUrl back to an older shipment', async () => {
    order.trackingUrl = 'http://track/newer';
    shipments.findOne.mockResolvedValue({
      ...shipment,
      id: 99,
      trackingUrl: 'http://track/newer',
    });
    await onShipmentSent(MerchProvider.PRINTFUL, '9', info);
    expect(orders.save).not.toHaveBeenCalled();
  });

  it('ignores unknown orders', async () => {
    orders.findOneBy.mockResolvedValue(null);
    await onShipmentSent(MerchProvider.PRINTFUL, '9', info);
    expect(shipments.upsert).not.toHaveBeenCalled();
  });
});
