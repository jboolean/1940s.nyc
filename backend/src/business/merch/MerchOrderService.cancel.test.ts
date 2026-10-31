import MerchOrderFulfillmentState from '../../enum/MerchOrderFulfillmentState';
import MerchOrderState from '../../enum/MerchOrderState';
import MerchProvider from '../../enum/MerchProvider';
import { cancelOrder } from './MerchOrderService';
import getFulfillmentProvider from './providers/getFulfillmentProvider';

const findOneByOrFail = jest.fn();
const save = jest.fn((o: unknown) => Promise.resolve(o));
jest.mock('../../createConnection', () => ({
  AppDataSource: { getRepository: () => ({ findOneByOrFail, save }) },
}));
jest.mock('./providers/getFulfillmentProvider', () => ({
  __esModule: true,
  default: jest.fn(),
  selectProviderForItems: jest.fn(),
}));
jest.mock('../users/UserService', () => ({}));
jest.mock('../email/EmailService', () => ({ __esModule: true, default: {} }));
jest.mock('../email/templates/OrderShippedTemplate', () => ({}));
jest.mock('../email/templates/OrderCustomizeTemplate', () => ({}));
jest.mock('../email/templates/OrderConfirmationTemplate', () => ({}));

describe('cancelOrder', () => {
  const cancelSubmittedOrder = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest
      .mocked(getFulfillmentProvider)
      .mockReturnValue({ cancelSubmittedOrder } as never);
  });

  it('cancels a Prodigi order that has not been sent yet without calling Prodigi', async () => {
    const order = {
      provider: MerchProvider.PRODIGI,
      state: MerchOrderState.PENDING_SUBMISSION,
      fulfillmentState: null,
    };
    findOneByOrFail.mockResolvedValue(order);
    await cancelOrder(1);
    expect(cancelSubmittedOrder).not.toHaveBeenCalled();
    expect(order.state).toBe(MerchOrderState.CANCELED);
  });

  it('cancels a submitted Prodigi order through Prodigi', async () => {
    const order = {
      provider: MerchProvider.PRODIGI,
      state: MerchOrderState.SUBMITTED_FOR_FULFILLMENT,
      fulfillmentState: MerchOrderFulfillmentState.IN_PROGRESS,
    };
    findOneByOrFail.mockResolvedValue(order);
    await cancelOrder(1);
    expect(cancelSubmittedOrder).toHaveBeenCalledWith(order);
    expect(order).toMatchObject({
      state: MerchOrderState.CANCELED,
      fulfillmentState: MerchOrderFulfillmentState.CANCELED,
    });
  });

  it('reports a 400 and leaves the order alone when Prodigi can no longer cancel', async () => {
    const order = {
      provider: MerchProvider.PRODIGI,
      state: MerchOrderState.SUBMITTED_FOR_FULFILLMENT,
      fulfillmentState: MerchOrderFulfillmentState.IN_PROGRESS,
    };
    findOneByOrFail.mockResolvedValue(order);
    cancelSubmittedOrder.mockRejectedValue(new Error('too late'));
    await expect(cancelOrder(1)).rejects.toMatchObject({ status: 400 });
    expect(order.state).toBe(MerchOrderState.SUBMITTED_FOR_FULFILLMENT);
    expect(save).not.toHaveBeenCalled();
  });
});
