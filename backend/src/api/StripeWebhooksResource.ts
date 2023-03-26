import express from 'express';
import ipfilter from 'express-ipfilter';

import Stripe from 'stripe';
import EmailCampaignService from '../business/email/EmailCampaignService';
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
      }
    }
    res.status(200).send();
  }
);

export default router;
