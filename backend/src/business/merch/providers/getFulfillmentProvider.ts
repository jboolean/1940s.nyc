import MerchInternalVariant from '../../../enum/MerchInternalVariant';
import MerchProvider from '../../../enum/MerchProvider';
import FulfillmentProvider from './FulfillmentProvider';
import PrintfulFulfillmentProvider from './PrintfulFulfillmentProvider';
import ProdigiFulfillmentProvider from './ProdigiFulfillmentProvider';

const PROVIDER_FOR_VARIANT: Record<MerchInternalVariant, MerchProvider> = {
  [MerchInternalVariant.TOTE_BAG_SMALL]: MerchProvider.PRINTFUL,
  [MerchInternalVariant.PRINT_HPR_4X6]: MerchProvider.PRODIGI,
  [MerchInternalVariant.PRINT_HPR_8X12]: MerchProvider.PRODIGI,
  [MerchInternalVariant.PRINT_FAP_8X12_FRAMED]: MerchProvider.PRODIGI,
};

const PROVIDERS: Record<MerchProvider, FulfillmentProvider> = {
  [MerchProvider.PRINTFUL]: PrintfulFulfillmentProvider,
  [MerchProvider.PRODIGI]: ProdigiFulfillmentProvider,
};

export function selectProviderForItems(
  itemTypes: MerchInternalVariant[]
): MerchProvider {
  const providers = new Set(itemTypes.map((t) => PROVIDER_FOR_VARIANT[t]));
  if (providers.size > 1) {
    throw new Error(
      `Items in one order must use a single provider, got: ${[...providers].join(', ')}`
    );
  }
  const [only] = [...providers];
  return only ?? MerchProvider.PRINTFUL;
}

export function getMerchProvider(variant: MerchInternalVariant): MerchProvider {
  const provider = PROVIDER_FOR_VARIANT[variant];
  if (!provider) {
    throw new Error(`No provider for variant ${variant}`);
  }
  return provider;
}

export default function getFulfillmentProvider(
  provider: MerchProvider
): FulfillmentProvider {
  return PROVIDERS[provider];
}
