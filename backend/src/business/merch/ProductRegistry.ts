import MerchInternalVariant from '../../enum/MerchInternalVariant';
import stripe from '../../third-party/stripe';
import isProduction from '../utils/isProduction';
import required from '../utils/required';
import { getCatalogDefaultPrice } from './checkoutSession';
import { getMerchLabel } from './merchCatalog';

// The live print products are created by hand in Stripe before prints launch. Until their ids
// are filled in here, a live checkout for a print is refused.
const LIVE_PRODUCT_NOT_CREATED_YET = undefined;

const MERCH_PRODUCT_IDS: Record<MerchInternalVariant, string | undefined> = {
  [MerchInternalVariant.TOTE_BAG_SMALL]: isProduction()
    ? 'prod_RmpsQvWdhK6uZf'
    : 'prod_RjkZ81n7LrxUnl',
  [MerchInternalVariant.PRINT_HPR_4X6]: isProduction()
    ? LIVE_PRODUCT_NOT_CREATED_YET
    : 'print-hpr-4x6',
  [MerchInternalVariant.PRINT_HPR_8X12]: isProduction()
    ? LIVE_PRODUCT_NOT_CREATED_YET
    : 'print-hpr-8x12',
  [MerchInternalVariant.PRINT_FAP_8X12_FRAMED]: isProduction()
    ? LIVE_PRODUCT_NOT_CREATED_YET
    : 'print-fap-8x12-framed',
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

// Only the variants that have a Stripe product in this mode, so a product that cannot be bought
// here is never offered.
export const getAvailableProducts = async (
  variants: MerchInternalVariant[]
): Promise<AvailableProduct[]> =>
  Promise.all(
    variants.filter(hasMerchProduct).map(async (variant) => ({
      variant,
      label: getMerchLabel(variant),
      priceAmount: required(
        (await getCatalogDefaultPrice(getMerchProductId(variant))).unit_amount,
        `unit_amount of ${variant}`
      ),
    }))
  );
