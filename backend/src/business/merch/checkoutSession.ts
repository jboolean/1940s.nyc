import type Stripe from 'stripe';
import User from '../../entities/User';
import stripe from '../../third-party/stripe';
import required from '../utils/required';

// The parts every merch checkout session shares, so a change to the customer fields or the
// allowed countries cannot be made in one checkout and forgotten in the other.
export function buildCheckoutSessionFields({
  successUrl,
  cancelUrl,
  user,
  metadata,
}: {
  successUrl: string;
  cancelUrl: string;
  user?: User;
  metadata?: Stripe.MetadataParam;
}): Pick<
  Stripe.Checkout.SessionCreateParams,
  | 'success_url'
  | 'cancel_url'
  | 'customer'
  | 'customer_creation'
  | 'customer_email'
  | 'shipping_address_collection'
  | 'metadata'
> {
  const stripeCustomerId: string | undefined =
    user?.stripeCustomerId ?? undefined;

  return {
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer: stripeCustomerId,
    // History: Stripe used to always create a customer, then it started creating "guest customers"
    // instead. Forcing a customer is what lets the webhook attach the session to the user.
    customer_creation: stripeCustomerId ? undefined : 'always',
    customer_email: stripeCustomerId ? undefined : (user?.email ?? undefined),
    shipping_address_collection: { allowed_countries: ['US'] },
    metadata: { userId: user?.id ?? null, ...metadata },
  };
}

// A catalog product's default price is the source of truth for what it costs, so a checkout
// references the price by id instead of sending an amount of its own.
export async function getCatalogDefaultPrice(
  productId: string
): Promise<Stripe.Price> {
  const product = await stripe.products.retrieve(productId, {
    expand: ['default_price'],
  });
  const price = required(
    product.default_price as Stripe.Price | null,
    `default price of ${productId}`
  );
  if (price.currency !== 'usd') {
    throw new Error(`${productId} price is in ${price.currency}, not usd`);
  }
  return price;
}
