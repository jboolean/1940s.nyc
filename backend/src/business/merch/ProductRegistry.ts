import MerchInternalVariant from '../../enum/MerchInternalVariant';
import stripe from '../../third-party/stripe';
import isProduction from '../utils/isProduction';
import required from '../utils/required';
import { getCatalogDefaultPrice } from './checkoutSession';
import { getMerchLabel } from './merchCatalog';

const MERCH_PRODUCT_IDS: Record<MerchInternalVariant, string | undefined> = {
  [MerchInternalVariant.TOTE_BAG_SMALL]: isProduction()
    ? 'prod_RmpsQvWdhK6uZf'
    : 'prod_RjkZ81n7LrxUnl',
  [MerchInternalVariant.PRINT_4X6]: isProduction()
    ? 'prod_VfcsrXpkJnMwhv'
    : 'prod_VfbmKx4y2G7RZ6',
  [MerchInternalVariant.PRINT_8X12]: isProduction()
    ? 'prod_Vfcu23HuC06cNI'
    : 'prod_Vfbm7xcuGExM5a',
  [MerchInternalVariant.FRAMED_PRINT_8X12_WALL]: isProduction()
    ? 'prod_VfcsY7jC9HCuWc'
    : 'prod_Vfbmgj1EFyu4Fp',
  [MerchInternalVariant.FRAMED_PRINT_5X7_EASEL]: isProduction()
    ? 'prod_Vfcu7QBHdlxYcZ'
    : 'prod_VfbmFYcvZM6TrL',
};

export function hasMerchProduct(variant: MerchInternalVariant): boolean {
  return !!MERCH_PRODUCT_IDS[variant];
}

export function getMerchProductId(variant: MerchInternalVariant): string {
  return required(MERCH_PRODUCT_IDS[variant], `Stripe product for ${variant}`);
}

export const getPriceIdForProduct = (productId: string): Promise<string> =>
  stripe.products
    .retrieve(productId)
    .then((product) => product.default_price as string);

export interface AvailableProduct {
  variant: MerchInternalVariant;
  label: string;
  priceAmount: number;
}

const PRICE_CACHE_TTL_MS = 5 * 60 * 1000;

// Prices change rarely and the available-products endpoints are public and hot, so keep each
// product's price for a few minutes instead of asking Stripe for it on every request.
const priceCache = new Map<
  string,
  { priceAmount: number; expiresAt: number }
>();

async function getCachedPriceAmount(
  variant: MerchInternalVariant
): Promise<number> {
  const productId = getMerchProductId(variant);
  const cached = priceCache.get(productId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.priceAmount;
  }

  try {
    const price = await getCatalogDefaultPrice(productId);
    const priceAmount = required(
      price.unit_amount,
      `unit_amount of ${variant}`
    );
    priceCache.set(productId, {
      priceAmount,
      expiresAt: Date.now() + PRICE_CACHE_TTL_MS,
    });
    return priceAmount;
  } catch (err) {
    // A stale price is better than failing the whole catalog while Stripe is unavailable.
    if (cached) {
      return cached.priceAmount;
    }
    throw err;
  }
}

// Only the variants that have a Stripe product in this mode, so a product that cannot be bought
// here is never offered.
export const getAvailableProducts = async (
  variants: MerchInternalVariant[]
): Promise<AvailableProduct[]> =>
  Promise.all(
    variants.filter(hasMerchProduct).map(async (variant) => ({
      variant,
      label: getMerchLabel(variant),
      priceAmount: await getCachedPriceAmount(variant),
    }))
  );
