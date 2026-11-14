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

// No address exists yet when shipping is quoted, and WHCC needs one. State and country alone give
// the same methods and prices as a full New York address. A ZIP would add Alaska and Hawaii methods.
const WHCC_QUOTE_ADDRESS = { state: 'NY', country: 'US' };

// Stripe allows five shipping options per session.
const MAX_SHIPPING_OPTIONS = 5;

// Checkout creation runs in a request with a 20 second limit.
const WHCC_QUOTE_BUDGET_MS = 12_000;

export function buildWhccShippingOptions(
  calculation: WhccClient.Calculation
): Stripe.Checkout.SessionCreateParams.ShippingOption[] {
  // Without tracking the customer gets no link or shipped email.
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

// One product per variant, built from its first photo.
// Shipping depends on product and quantity, not the image.
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
      // Originals are not served through the Cloudflare bypass origin.
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
