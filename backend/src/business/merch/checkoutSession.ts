import type Stripe from 'stripe';
import stripe from '../../third-party/stripe';
import required from '../utils/required';

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
