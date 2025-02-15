import express from 'express';
import ipfilter from 'express-ipfilter';
import stripe from './stripe';

import compact from 'lodash/compact';
import groupBy from 'lodash/groupBy';
import Stripe from 'stripe';
import EmailCampaignService from '../business/email/EmailCampaignService';
import * as LedgerService from '../business/ledger/LedgerService';
import * as MerchOrderService from '../business/merch/MerchOrderService';
import * as UserService from '../business/users/UserService';
import isProduction from '../business/utils/isProduction';
import MerchInternalVariant from '../enum/MerchInternalVariant';
const router = express.Router();

type ProductMetadata = {
  'product-type'?: 'color-credit' | 'merch';
  'merch-internal-variant'?: MerchInternalVariant;
};

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
      case 'checkout.session.async_payment_succeeded':
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status !== 'paid') {
          console.warn('Checkout session was not paid', session);
          break;
        }
        // Retrieve the session to expand the line items
        const expandedSession = await stripe.checkout.sessions.retrieve(
          session.id,
          {
            expand: ['line_items', 'line_items.data.price.product'],
          }
        );
        const paymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : null;
        const subtotalAmountCents = session.amount_subtotal;

        const userId = await UserService.attachStripeCustomerAndDetermineUserId(
          expandedSession.customer as string,
          expandedSession.metadata?.userId
            ? parseInt(expandedSession.metadata.userId, 10)
            : undefined,
          expandedSession.customer_details?.email ?? undefined
        );

        // See if they purchased credits
        const byProductType = groupBy(
          expandedSession.line_items?.data,
          (lineItem) =>
            (
              (lineItem.price?.product as Stripe.Product)
                .metadata as ProductMetadata
            )['product-type']
        );

        const creditsLineItems = byProductType['color-credit'] ?? [];

        // fulfill credit purchases
        for (const creditsLineItem of creditsLineItems) {
          const quantity = creditsLineItem.quantity;
          if (typeof userId !== 'number') {
            throw new Error('userId is missing from purchase of credits');
          }
          if (typeof quantity !== 'number') {
            throw new Error('quantity is missing from purchase of credits');
          }
          console.log('Fulfilling purchase of credits', {
            customer: session.customer,
            userId,
            quantity,
          });
          await LedgerService.grantCredits(
            userId,
            quantity,
            paymentIntentId,
            subtotalAmountCents || 0
          );
        }

        const merchLineItems = byProductType['merch'] ?? [];
        console.log('merch items', merchLineItems);
        if (merchLineItems.length) {
          const shippingAddress = {
            name: expandedSession.shipping_details?.name,
            line1:
              expandedSession.shipping_details?.address?.line1 ?? undefined,
            line2:
              expandedSession.shipping_details?.address?.line2 ?? undefined,
            city: expandedSession.shipping_details?.address?.city ?? undefined,
            stateCode:
              expandedSession.shipping_details?.address?.state ?? undefined,
            postalCode:
              expandedSession.shipping_details?.address?.postal_code ??
              undefined,
            countryCode:
              expandedSession.shipping_details?.address?.country ?? undefined,
          };

          const order = await MerchOrderService.createEmptyMerchOrder(
            session.id,
            shippingAddress
          );

          const itemTypes = compact(
            merchLineItems.map(
              (lineItem) =>
                (
                  (lineItem.price?.product as Stripe.Product)
                    .metadata as ProductMetadata
                )['merch-internal-variant']
            )
          );

          const orderItems = await MerchOrderService.createOrderItems(
            order,
            itemTypes
          );
          console.log('created order items', orderItems);
        }

        if (!creditsLineItems.length) {
          // Grant some credits from their non-credit payment, see comment on LedgerService
          if (
            userId &&
            subtotalAmountCents &&
            typeof paymentIntentId === 'string'
          ) {
            await LedgerService.grantCreditsForTip(
              userId,
              subtotalAmountCents,
              paymentIntentId
            );
          } else {
            console.warn(
              'Stripe webhook missing required data to update ledger',
              event
            );
          }
        }
        break;
      }
    }
    res.status(200).send();
  }
);

export default router;
