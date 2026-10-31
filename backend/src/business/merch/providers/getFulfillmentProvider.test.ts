import MerchInternalVariant from '../../../enum/MerchInternalVariant';
import MerchProvider from '../../../enum/MerchProvider';
import getFulfillmentProvider, {
  selectProviderForItems,
} from './getFulfillmentProvider';
import PrintfulFulfillmentProvider from './PrintfulFulfillmentProvider';

jest.mock('../PrintfulService', () => ({}));

describe('selectProviderForItems', () => {
  it('uses Printful for tote bags', () => {
    expect(selectProviderForItems([MerchInternalVariant.TOTE_BAG_SMALL])).toBe(
      MerchProvider.PRINTFUL
    );
  });

  it('defaults to Printful for an empty list', () => {
    expect(selectProviderForItems([])).toBe(MerchProvider.PRINTFUL);
  });
});

describe('getFulfillmentProvider', () => {
  it('returns the Printful implementation', () => {
    expect(getFulfillmentProvider(MerchProvider.PRINTFUL)).toBe(
      PrintfulFulfillmentProvider
    );
  });

  it('has an implementation for every provider', () => {
    for (const provider of Object.values(MerchProvider)) {
      expect(getFulfillmentProvider(provider)).toBeDefined();
    }
  });
});
