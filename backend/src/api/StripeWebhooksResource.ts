import express from 'express';
import ipfilter from 'express-ipfilter';

import Stripe from 'stripe';
import EmailCampaignService from '../business/email/EmailCampaignService';
import * as LedgerService from '../business/ledger/LedgerService';
import * as UserService from '../business/users/UserService';
import isProduction from '../business/utils/isProduction';
const router = express.Router();

const STRIPE_IPS = [
  '3.18.12.63',
  '3.130.192.231',
  '13.235.14.237',
  '13.235.122.149',
  '18.211.135.69',
  '35.154.171.200',
  '52.15.183.38',
  '54.88.130.119',
  '54.88.130.237',
  '54.187.174.169',
  '54.187.205.235',
  '54.187.216.72',
];

if (!isProduction()) {
  STRIPE_IPS.push('127.0.0.1');
}

router.use('/', ipfilter.IpFilter(STRIPE_IPS, { mode: 'allow' }));

router.post<'/', unknown, unknown, Stripe.Event, unknown>(
  '/',
  async (req, res) => {
    const event = req.body;
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const email = paymentIntent.receipt_email;
        if (email) {
          await EmailCampaignService.addToMailingList(email, 'stripe');
        }
        break;
      }
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId
          ? parseInt(session.metadata.userId, 10)
          : undefined;

        // Grant some credits from their payment, see comment on LedgerService
        const amountCents = session.amount_subtotal;
        const paymentIntent = session.payment_intent;
        if (userId && amountCents && typeof paymentIntent === 'string') {
          await LedgerService.grantCreditsForPayment(
            userId,
            amountCents,
            paymentIntent
          );
        } else {
          console.warn(
            'Stripe webhook missing required data to update ledger',
            event
          );
        }

        // Attach the customer to the user and also set an email if the user was anonymous
        const customer = session.customer;
        const email = session.customer_details?.email;
        if (userId && typeof customer === 'string') {
          await UserService.attachStripeCustomer(
            userId,
            customer,
            email ?? undefined
          );
        } else {
          console.warn(
            'Stripe webhook missing required data to update user',
            event
          );
        }
        break;
      }
    }
    res.status(200).send();
  }
);

export default router;
