import Stripe from 'stripe';

const { STRIPE_SK } = process.env;

const stripe = new Stripe(STRIPE_SK || '', {
  apiVersion: '2025-02-24.acacia',
});

export default stripe;
