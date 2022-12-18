import Stripe from 'stripe';

const { STRIPE_SK } = process.env;

const stripe = new Stripe(STRIPE_SK || '', {
  apiVersion: '2022-11-15',
});

export default stripe;
