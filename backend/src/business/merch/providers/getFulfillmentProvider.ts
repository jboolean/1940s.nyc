import MerchInternalVariant from '../../../enum/MerchInternalVariant';
import MerchProvider from '../../../enum/MerchProvider';
import { getMerchProvider } from '../merchCatalog';
import FulfillmentProvider from './FulfillmentProvider';
import PrintfulFulfillmentProvider from './PrintfulFulfillmentProvider';
import ProdigiFulfillmentProvider from './ProdigiFulfillmentProvider';

const PROVIDERS: Record<MerchProvider, FulfillmentProvider> = {
  [MerchProvider.PRINTFUL]: PrintfulFulfillmentProvider,
  [MerchProvider.PRODIGI]: ProdigiFulfillmentProvider,
};

export function selectProviderForItems(
  itemTypes: MerchInternalVariant[]
): MerchProvider {
  const providers = new Set(itemTypes.map(getMerchProvider));
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

// The providers whose orders wait for a person instead of going straight to the printer.
export function getProvidersNeedingReview(): MerchProvider[] {
  return (Object.keys(PROVIDERS) as MerchProvider[]).filter(
    (provider) => PROVIDERS[provider].requiresReview
  );
}

// The providers that send an order to the printer without a person looking at it first.
export function getProvidersWithoutReview(): MerchProvider[] {
  return (Object.keys(PROVIDERS) as MerchProvider[]).filter(
    (provider) => !PROVIDERS[provider].requiresReview
  );
}
