import { loadStripe, Stripe } from '@stripe/stripe-js';

// Provided by webpack.DefinePlugin
const KEY = __STRIPE_PK__;

export default function getStripe(): Promise<Stripe> {
  return loadStripe(KEY);
}
