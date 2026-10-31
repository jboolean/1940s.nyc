import MerchOrder from '../../../entities/MerchOrder';
import MerchOrderFulfillmentState from '../../../enum/MerchOrderFulfillmentState';
import PrintfulFulfillmentProvider from './PrintfulFulfillmentProvider';
import * as PrintfulService from '../PrintfulService';

jest.mock('../PrintfulService');
jest.mock('../../utils/printfulApi', () => ({}));

const printful = jest.mocked(PrintfulService);

describe('PrintfulFulfillmentProvider', () => {
  it('stringifies the Printful order id and starts in draft', async () => {
    printful.createEmptyOrder.mockResolvedValue({ id: 123 } as never);
    const result = await PrintfulFulfillmentProvider.createOrder(7, {});
    expect(result).toEqual({
      providerOrderId: '123',
      fulfillmentState: MerchOrderFulfillmentState.DRAFT,
    });
  });

  it('submits using a numeric Printful order id', async () => {
    const order = { providerOrderId: '123' } as MerchOrder;
    await PrintfulFulfillmentProvider.submitOrderForFulfillment(order);
    expect(printful.submitOrderForFulfillment).toHaveBeenCalledWith(123);
  });
});
