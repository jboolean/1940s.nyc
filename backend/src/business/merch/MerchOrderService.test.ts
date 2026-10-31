import MerchOrder from '../../entities/MerchOrder';
import MerchShipment from '../../entities/MerchShipment';
import MerchProvider from '../../enum/MerchProvider';
import EmailService from '../email/EmailService';
import { onShipmentSent } from './MerchOrderService';

const orders = { findOneBy: jest.fn(), save: jest.fn() };
const shipments = { findOneBy: jest.fn(), save: jest.fn() };

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
  const order = { id: 5, userId: 1 } as MerchOrder;

  beforeEach(() => {
    jest.clearAllMocks();
    orders.findOneBy.mockResolvedValue(order);
    orders.save.mockImplementation((o: unknown) => Promise.resolve(o));
  });

  it('records a new shipment and emails once', async () => {
    shipments.findOneBy.mockResolvedValue(null);
    await onShipmentSent(MerchProvider.PRINTFUL, '9', {
      providerShipmentId: 's1',
      trackingUrl: 'http://track/1',
    });
    expect(shipments.save).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 5,
        providerShipmentId: 's1',
        trackingUrl: 'http://track/1',
      })
    );
    expect(orders.save).toHaveBeenCalledWith(
      expect.objectContaining({ trackingUrl: 'http://track/1' })
    );
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('does not re-email a shipment it already has', async () => {
    shipments.findOneBy.mockResolvedValue(new MerchShipment());
    await onShipmentSent(MerchProvider.PRINTFUL, '9', {
      providerShipmentId: 's1',
      trackingUrl: 'http://track/1',
    });
    expect(shipments.save).toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('ignores unknown orders', async () => {
    orders.findOneBy.mockResolvedValue(null);
    await onShipmentSent(MerchProvider.PRINTFUL, '9', {
      providerShipmentId: 's1',
    });
    expect(shipments.save).not.toHaveBeenCalled();
  });
});
