import type Stripe from 'stripe';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import type { ShippingQuoteItem } from '../merch/providers/FulfillmentProvider';
import { getOriginalPublicUrl } from '../utils/printfileUtils';
import required from '../utils/required';
import toCents from '../utils/toCents';
import { buildConfiguredProducts } from './buildConfiguredProducts';
import { buildWhccConfiguredProduct } from './buildWhccSubmission';
import * as WhccClient from './whccApi';

export const WHCC_SHIPPING_METHOD_METADATA_KEY = 'whcc-shipping-priority';

// Checkout has not collected an address when shipping is quoted, and calculate offers no shipping
// methods without one, so quotes use a representative US address.
const WHCC_QUOTE_ADDRESS: WhccClient.ShippingAddress = {
  name: 'Shipping quote',
  addr1: '350 5th Ave',
  city: 'New York',
  state: 'NY',
  zip: '10118',
  country: 'US',
};

// Stripe allows at most five shipping options on a session.
const MAX_SHIPPING_OPTIONS = 5;

// Checkout creation runs inside a request with a 20 second limit.
const WHCC_QUOTE_BUDGET_MS = 12_000;

export function buildWhccShippingOptions(
  calculation: WhccClient.Calculation
): Stripe.Checkout.SessionCreateParams.ShippingOption[] {
  // A shipment without tracking would leave the customer with no tracking link or shipped email.
  return (calculation.options?.shipping ?? [])
    .filter((o) => !o.priority.endsWith('_no_tracking'))
    .slice(0, MAX_SHIPPING_OPTIONS)
    .map((o) => {
      if (o.price.code !== 'USD') {
        throw new Error(`WHCC quoted shipping in ${o.price.code}, not USD`);
      }
      return {
        shipping_rate_data: {
          type: 'fixed_amount',
          display_name: o.label,
          fixed_amount: { amount: toCents(o.price.value), currency: 'usd' },
          metadata: { [WHCC_SHIPPING_METHOD_METADATA_KEY]: o.priority },
        },
      };
    });
}

// One configured product is built per variant, from the first photo bought in it, because shipping
// depends on the product and quantity and not on the image.
export async function quoteWhccShipping(
  items: ShippingQuoteItem[]
): Promise<Stripe.Checkout.SessionCreateParams.ShippingOption[]> {
  const byVariant = new Map<
    MerchInternalVariant,
    { photoIdentifier: string; quantity: number }
  >();
  for (const item of items) {
    const entry = byVariant.get(item.variant);
    if (entry) {
      entry.quantity += item.quantity;
    } else {
      byVariant.set(item.variant, {
        photoIdentifier: required(item.print, `print for ${item.variant}`)
          .photoIdentifier,
        quantity: item.quantity,
      });
    }
  }
  const lines = [...byVariant].map(([variant, line]) => {
    return {
      // The plain URL: original photos are not served through the Cloudflare bypass origin.
      request: buildWhccConfiguredProduct(
        variant,
        getOriginalPublicUrl(line.photoIdentifier)
      ),
      quantity: line.quantity,
    };
  });
  const deadline = Date.now() + WHCC_QUOTE_BUDGET_MS;
  const built = await buildConfiguredProducts(
    lines.map((l) => l.request),
    deadline
  );
  const options = buildWhccShippingOptions(
    await WhccClient.calculate(
      {
        items: built.map((b, i) => ({
          configuredProductId: b.configuredProductId,
          quantity: lines[i].quantity,
        })),
        shipping: { type: 'dropship', address: WHCC_QUOTE_ADDRESS },
      },
      deadline
    )
  );
  if (!options.length) {
    throw new Error('WHCC returned no shipping options');
  }
  return options;
}
