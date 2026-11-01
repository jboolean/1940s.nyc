import MerchProvider from '../../../enum/MerchProvider';
import getFulfillmentProvider, {
  getProvidersNeedingReview,
  getProvidersWithoutReview,
} from './getFulfillmentProvider';

// The providers themselves pull in their API clients, which want credentials at import time.
jest.mock('./PrintfulFulfillmentProvider', () => ({
  __esModule: true,
  default: { requiresReview: true },
}));
jest.mock('./ProdigiFulfillmentProvider', () => ({
  __esModule: true,
  default: { requiresReview: true },
}));

describe('provider capabilities', () => {
  it('lists every provider as needing review while none submit on their own', () => {
    expect(getProvidersNeedingReview()).toEqual([
      MerchProvider.PRINTFUL,
      MerchProvider.PRODIGI,
    ]);
    expect(getProvidersWithoutReview()).toEqual([]);
  });

  it('agrees with each provider on which side it is on', () => {
    for (const provider of Object.values(MerchProvider)) {
      const { requiresReview } = getFulfillmentProvider(provider);
      expect(getProvidersNeedingReview().includes(provider)).toBe(
        requiresReview
      );
      expect(getProvidersWithoutReview().includes(provider)).toBe(
        !requiresReview
      );
    }
  });
});
