import type Stripe from 'stripe';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import stripe from '../../third-party/stripe';
import isProduction from '../utils/isProduction';
import required from '../utils/required';

export const MERCH_PRODUCT_IDS: Record<MerchInternalVariant, string> = {
  [MerchInternalVariant.TOTE_BAG_SMALL]: isProduction()
    ? 'prod_RmpsQvWdhK6uZf'
    : 'prod_RjkZ81n7LrxUnl',
};

export const getPriceIdForProduct = (productId: string): Promise<string> =>
  stripe.products
    .retrieve(productId)
    .then((product) => product.default_price as string);

export interface AvailableProduct {
  variant: MerchInternalVariant;
  priceAmount: number;
}

export const getAllAvailableProducts = async (): Promise<AvailableProduct[]> =>
  Promise.all(
    [MerchInternalVariant.TOTE_BAG_SMALL].map(async (variant) => {
      const product = await stripe.products.retrieve(
        MERCH_PRODUCT_IDS[variant],
        { expand: ['default_price'] }
      );
      const price = required(
        product.default_price as Stripe.Price,
        'product.default_price'
      );
      return {
        variant,
        priceAmount: required(price.unit_amount, 'price.unit_amount'),
      };
    })
  );
