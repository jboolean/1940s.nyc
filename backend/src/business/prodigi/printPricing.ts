import MerchInternalVariant from '../../enum/MerchInternalVariant';

// Unit price in cents. These seed the Stripe products (see scripts/setupPrintStripeProducts.ts);
// Stripe's default price is what customers are charged, so edit prices in Stripe afterwards.
export const PRINT_PRICE_CENTS: Record<string, number> = {
  [MerchInternalVariant.PRINT_HPR_4X6]: 1200,
  [MerchInternalVariant.PRINT_HPR_8X12]: 1900,
  [MerchInternalVariant.PRINT_FAP_4X6]: 1100,
  [MerchInternalVariant.PRINT_FAP_8X12]: 1900,
  [MerchInternalVariant.PRINT_PHO_4X6]: 700,
  [MerchInternalVariant.PRINT_PHO_8X12]: 1500,
  [MerchInternalVariant.PRINT_FAP_8X12_FRAMED]: 5900,
};

// Prodigi item cost and Budget shipping for a single item to the US, from POST /v4.0/quotes
// (identical in sandbox and live). Used to check margins; checkout charges the live quote.
export const PRINT_COST_CENTS: Record<
  string,
  { item: number; budgetShipping: number }
> = {
  [MerchInternalVariant.PRINT_HPR_4X6]: { item: 700, budgetShipping: 685 },
  [MerchInternalVariant.PRINT_HPR_8X12]: { item: 1100, budgetShipping: 685 },
  [MerchInternalVariant.PRINT_FAP_4X6]: { item: 600, budgetShipping: 685 },
  [MerchInternalVariant.PRINT_FAP_8X12]: { item: 1100, budgetShipping: 685 },
  [MerchInternalVariant.PRINT_PHO_4X6]: { item: 50, budgetShipping: 670 },
  [MerchInternalVariant.PRINT_PHO_8X12]: { item: 400, budgetShipping: 670 },
  [MerchInternalVariant.PRINT_FAP_8X12_FRAMED]: {
    item: 3400,
    budgetShipping: 2480,
  },
};

const STRIPE_PERCENT = 0.029;
const STRIPE_FIXED_CENTS = 30;

// Shipping is charged to the customer at cost, but Stripe's fee applies to the whole charge,
// so the fee on the shipping portion comes out of the item margin.
export function printMarginCents(variant: string): number {
  const price = PRINT_PRICE_CENTS[variant];
  const { item, budgetShipping } = PRINT_COST_CENTS[variant];
  const stripeFee =
    (price + budgetShipping) * STRIPE_PERCENT + STRIPE_FIXED_CENTS;
  return Math.round(price - item - stripeFee);
}
