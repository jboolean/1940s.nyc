import MerchOrder from '../../../entities/MerchOrder';
import * as ProdigiService from '../../prodigi/ProdigiService';
import ProdigiFulfillmentProvider from './ProdigiFulfillmentProvider';

const update = jest.fn();
jest.mock('../../../createConnection', () => ({
  AppDataSource: { getRepository: () => ({ update }) },
}));
jest.mock('../../prodigi/ProdigiService', () => ({
  createOrder: jest.fn(),
  cancelOrder: jest.fn(),
}));
jest.mock('../../prodigi/buildProdigiOrder', () => ({
  buildProdigiOrder: jest.fn(() => ({ built: true })),
}));
jest.mock('../../users/UserService', () => ({
  getUser: jest.fn().mockResolvedValue({ email: 'a@b.c' }),
}));

describe('ProdigiFulfillmentProvider', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates the Prodigi order on submit and records its id immediately', async () => {
    jest
      .mocked(ProdigiService.createOrder)
      .mockResolvedValue({ id: 'ord_9' } as never);
    const order = { id: 3, userId: 1 } as MerchOrder;
    await ProdigiFulfillmentProvider.submitOrderForFulfillment(order);
    expect(order.providerOrderId).toBe('ord_9');
    expect(update).toHaveBeenCalledWith(3, { providerOrderId: 'ord_9' });
  });

  it('does not create a second Prodigi order for one that was already submitted', async () => {
    await ProdigiFulfillmentProvider.submitOrderForFulfillment({
      id: 3,
      providerOrderId: 'ord_9',
    } as MerchOrder);
    expect(ProdigiService.createOrder).not.toHaveBeenCalled();
  });

  it('creates nothing at checkout time', async () => {
    expect(await ProdigiFulfillmentProvider.createOrder(1, {})).toEqual({});
  });
});
