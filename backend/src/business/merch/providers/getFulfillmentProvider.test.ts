import MerchInternalVariant from '../../../enum/MerchInternalVariant';
import MerchProvider from '../../../enum/MerchProvider';
import getFulfillmentProvider, {
  getProvidersNeedingReview,
  getProvidersWithoutReview,
  selectProviderForItems,
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

describe('selectProviderForItems', () => {
  it('picks the one provider every item shares', () => {
    expect(
      selectProviderForItems([
        MerchInternalVariant.PRINT_HPR_4X6,
        MerchInternalVariant.PRINT_FAP_8X12_FRAMED,
      ])
    ).toBe(MerchProvider.PRODIGI);
  });

  it('refuses a variant the catalog does not sell rather than guessing a printer', () => {
    expect(() =>
      selectProviderForItems(['tote-bag-large' as MerchInternalVariant])
    ).toThrow('No provider for variant tote-bag-large');
  });

  it('refuses an order with no items', () => {
    expect(() => selectProviderForItems([])).toThrow(
      'An order needs at least one item'
    );
  });
});
