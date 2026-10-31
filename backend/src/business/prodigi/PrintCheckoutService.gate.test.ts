import MerchInternalVariant from '../../enum/MerchInternalVariant';
import {
  createPrintCheckoutSession,
  getAvailablePrintProducts,
} from './PrintCheckoutService';

jest.mock('../../createConnection', () => ({ AppDataSource: {} }));
jest.mock('./ProdigiService', () => ({}));
jest.mock('../../third-party/stripe', () => ({
  __esModule: true,
  default: {},
}));

describe('while the Prodigi provider is not implemented', () => {
  it('offers no products and refuses to start a checkout', async () => {
    expect(await getAvailablePrintProducts()).toEqual([]);
    await expect(
      createPrintCheckoutSession({
        successUrl: 'a',
        cancelUrl: 'b',
        photoIdentifier: 'p1',
        variant: MerchInternalVariant.PRINT_HPR_8X12,
        quantity: 1,
        colorize: false,
      })
    ).rejects.toMatchObject({ status: 503 });
  });
});
