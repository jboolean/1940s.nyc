import type Stripe from 'stripe';
import { calculateShppingRates } from '../utils/printfulApi';
import required from '../utils/required';
import toCents from '../utils/toCents';
import { INTERNAL_VARIANT_TO_PRINTFUL_VARIANT } from './PrintfulItemBuildService';
import type { ShippingQuoteItem } from './providers/FulfillmentProvider';

export const PRINTFUL_SHIPPING_METHOD_METADATA_KEY = 'printful-shipping-method';

// Checkout has not collected an address when shipping is quoted, so quotes use a representative US address.
// Printful rejects a quote without a state; it prices the same across the US for the products sold.
const QUOTE_ADDRESS = {
  address1: '350 5th Ave',
  city: 'New York',
  state_code: 'NY',
  country_code: 'US',
  zip: '10118',
};

// Stripe allows at most five shipping options on a session.
const MAX_SHIPPING_OPTIONS = 5;

type PrintfulRate = NonNullable<
  Awaited<ReturnType<typeof calculateShppingRates>>['data']
>['data'][number];

export function buildPrintfulShippingOptions(
  rates: PrintfulRate[]
): Stripe.Checkout.SessionCreateParams.ShippingOption[] {
  return rates.slice(0, MAX_SHIPPING_OPTIONS).map((rate) => {
    if (rate.currency !== 'USD') {
      throw new Error(`Printful quoted shipping in ${rate.currency}, not USD`);
    }
    return {
      shipping_rate_data: {
        type: 'fixed_amount',
        display_name: rate.shipping_method_name
          .replace(/\s*\(Estimated delivery:.*\)\s*$/, '')
          .trim(),
        fixed_amount: { amount: toCents(rate.rate), currency: 'usd' },
        ...(rate.min_delivery_days !== undefined &&
        rate.max_delivery_days !== undefined
          ? {
              delivery_estimate: {
                minimum: {
                  unit: 'business_day' as const,
                  value: rate.min_delivery_days,
                },
                maximum: {
                  unit: 'business_day' as const,
                  value: rate.max_delivery_days,
                },
              },
            }
          : {}),
        metadata: { [PRINTFUL_SHIPPING_METHOD_METADATA_KEY]: rate.shipping },
      },
    };
  });
}

// Printful prices shipping per basket and destination, so the options are quoted for each checkout.
export async function quotePrintfulShipping(
  items: ShippingQuoteItem[]
): Promise<Stripe.Checkout.SessionCreateParams.ShippingOption[]> {
  const resp = await calculateShppingRates({
    body: {
      recipient: QUOTE_ADDRESS,
      currency: 'USD',
      order_items: items.map((item) => ({
        source: 'catalog' as const,
        catalog_variant_id: required(
          (
            INTERNAL_VARIANT_TO_PRINTFUL_VARIANT as Partial<
              Record<string, number>
            >
          )[item.variant],
          `Printful variant for ${item.variant}`
        ),
        quantity: item.quantity,
      })),
    },
  });
  if (resp.error || !resp.data) {
    throw new Error(
      `Printful shipping rates failed: ${JSON.stringify(resp.error)}`
    );
  }
  const options = buildPrintfulShippingOptions(resp.data.data);
  if (!options.length) {
    throw new Error('Printful returned no shipping options');
  }
  return options;
}
