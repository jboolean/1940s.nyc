import Stripe from 'stripe';

const { STRIPE_SK } = process.env;

const stripe = new Stripe(STRIPE_SK || '', {
  apiVersion: '2022-08-01',
});

export default stripe;
