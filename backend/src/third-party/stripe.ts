import Stripe from 'stripe';

const { STRIPE_SK } = process.env;

const stripe = new Stripe(STRIPE_SK || '', {
  apiVersion: '2026-03-25.dahlia',
});

export default stripe;
