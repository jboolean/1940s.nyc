import type { Quote, ShippingMethod } from 'prodigi-print-api';
import type Stripe from 'stripe';

// Approximate business days from order to delivery, including production.
const OFFERED_METHODS: Partial<
  Record<ShippingMethod, { min: number; max: number }>
> = {
  Budget: { min: 5, max: 10 },
  Standard: { min: 4, max: 8 },
  Express: { min: 3, max: 5 },
};

export const PRODIGI_SHIPPING_METHOD_METADATA_KEY = 'prodigi-shipping-method';

function toCents(amount: string): number {
  return Math.round(parseFloat(amount) * 100);
}

// Turns Prodigi quotes into Checkout shipping options that charge exactly the quoted cost.
// Budget is dropped when it costs no less than Standard (they are the same service for some products).
export function buildShippingOptions(
  quotes: Quote[]
): Stripe.Checkout.SessionCreateParams.ShippingOption[] {
  const offered = quotes
    .filter((q) => q.shipmentMethod in OFFERED_METHODS)
    .map((q) => ({
      method: q.shipmentMethod as ShippingMethod,
      cents: toCents(q.costSummary.shipping.amount),
      service: q.shipments[0]?.carrier.service,
    }));

  const standard = offered.find((o) => o.method === 'Standard');
  const options = offered.filter(
    (o) => !(o.method === 'Budget' && standard && o.cents >= standard.cents)
  );

  return options.map(({ method, cents, service }) => {
    const estimate = OFFERED_METHODS[method] as { min: number; max: number };
    return {
      shipping_rate_data: {
        type: 'fixed_amount',
        display_name: service ? `${method} (${service})` : method,
        fixed_amount: { amount: cents, currency: 'usd' },
        delivery_estimate: {
          minimum: { unit: 'business_day', value: estimate.min },
          maximum: { unit: 'business_day', value: estimate.max },
        },
        metadata: { [PRODIGI_SHIPPING_METHOD_METADATA_KEY]: method },
      },
    };
  });
}
