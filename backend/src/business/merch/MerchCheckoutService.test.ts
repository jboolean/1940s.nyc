import MerchInternalVariant from '../../enum/MerchInternalVariant';
import { createMerchCheckoutSession } from './MerchCheckoutService';

jest.mock('../../third-party/stripe', () => ({
  __esModule: true,
  default: {},
}));

describe('createMerchCheckoutSession', () => {
  it('rejects print variants with a 400', async () => {
    await expect(
      createMerchCheckoutSession({
        successUrl: 'http://x',
        cancelUrl: 'http://x',
        items: [{ variant: MerchInternalVariant.PRINT_HPR_8X12, quantity: 1 }],
      })
    ).rejects.toMatchObject({ status: 400 });
  });
});
