import express from 'express';
import ipfilter from 'express-ipfilter';
import stripe from '../third-party/stripe';

import groupBy from 'lodash/groupBy';
import type Stripe from 'stripe';
import EmailCampaignService from '../business/email/EmailCampaignService';
import * as LedgerService from '../business/ledger/LedgerService';
import * as MerchOrderService from '../business/merch/MerchOrderService';
import {
  getMerchProvider,
  isPrintVariant,
} from '../business/merch/merchCatalog';
import { PRODIGI_SHIPPING_METHOD_METADATA_KEY } from '../business/prodigi/printShipping';
import * as UserService from '../business/users/UserService';
import isProduction from '../business/utils/isProduction';
import MerchInternalVariant from '../enum/MerchInternalVariant';
import MerchItemState from '../enum/MerchItemState';
import MerchProvider from '../enum/MerchProvider';
const router = express.Router();

// A tote bag is customized by the customer after purchase, so each of its copies is one item
// with no options. A print arrives fully specified from checkout: the variant comes off the
// product, and the card details off the line item's own metadata, since they are per purchase.
export function merchLineItemToOrderItems(
  lineItem: Stripe.LineItem
): MerchOrderService.NewOrderItem[] {
  const variant = (
    (lineItem.price?.product as Stripe.Product).metadata as ProductMetadata
  )['merch-internal-variant'];
  if (!variant) {
    throw new Error(`Merch line item ${lineItem.id} has no variant`);
  }
  const copies = lineItem.quantity ?? 1;
  if (!isPrintVariant(variant)) {
    return Array.from({ length: copies }, () => ({ variant }));
  }
  const purchase = (lineItem.metadata ?? {}) as LineItemMetadata;
  const photoIdentifier = purchase['photo-identifier'];
  if (!photoIdentifier) {
    throw new Error(`Print line item ${lineItem.id} has no photo identifier`);
  }
  const customizationOptions = {
    variant,
    photoIdentifier,
    colorize: purchase.colorize === 'true',
  };
  return Array.from({ length: copies }, () => ({
    variant,
    customizationOptions,
    state: MerchItemState.CUSTOMIZED,
  }));
}

type ProductMetadata = {
  'product-type'?: 'color-credit' | 'merch' | 'tip';
  'merch-internal-variant'?: MerchInternalVariant;
};

const HANDLED_PRODUCT_TYPES: ProductMetadata['product-type'][] = [
  'color-credit',
  'merch',
  'tip',
];

const productMetadata = (lineItem: Stripe.LineItem): ProductMetadata =>
  (lineItem.price?.product as Stripe.Product).metadata;

type LineItemMetadata = {
  'photo-identifier'?: string;
  colorize?: 'true' | 'false';
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

// ipfilter does not use express's `trust proxy`, so repeat the hop count here
router.use(
  '/',
  ipfilter.IpFilter(STRIPE_IPS, { mode: 'allow', trustProxy: 3 })
);

router.post<'/', unknown, unknown, Stripe.Event, unknown>(
  '/',
  async (req, res) => {
    const event = req.body;
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const email = paymentIntent.receipt_email;
        if (email) {
          await EmailCampaignService.addToMailingList(email, 'stripe');
        }
        break;
      }
      case 'checkout.session.async_payment_succeeded':
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.payment_status !== 'paid') {
          console.warn('Checkout session was not paid', session);
          break;
        }
        // Retrieve the session to expand the line items
        const expandedSession = await stripe.checkout.sessions.retrieve(
          session.id,
          {
            expand: [
              'line_items',
              'line_items.data.price.product',
              'shipping_cost.shipping_rate',
            ],
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

        // A product tagged with a type this webhook does not know, or a merch product that is not
        // tagged merch, would otherwise be dropped without an error. Stop before creating anything:
        // a non-2xx reply asks Stripe to retry, which is safe because nothing was created. An
        // untagged product that is not merch keeps being handled as it always was.
        const unhandled = (expandedSession.line_items?.data ?? []).filter(
          (lineItem) => {
            const type = productMetadata(lineItem)['product-type'];
            return type
              ? !HANDLED_PRODUCT_TYPES.includes(type)
              : !!productMetadata(lineItem)['merch-internal-variant'];
          }
        );
        if (unhandled.length) {
          console.error(
            '[merch-alert] checkout session has line items with a product-type this webhook does not handle; nothing was created',
            {
              sessionId: session.id,
              lineItems: unhandled.map((lineItem) => ({
                id: lineItem.id,
                productType: productMetadata(lineItem)['product-type'],
              })),
            }
          );
          return res.status(500).send();
        }

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
            creditsLineItem.amount_subtotal || 0
          );
        }

        const newItems = (byProductType['merch'] ?? []).flatMap(
          merchLineItemToOrderItems
        );
        const providers = new Set(
          newItems.map((item) => getMerchProvider(item.variant))
        );
        if (providers.size > 1) {
          // Our checkouts never mix printers, and the provider choice rejects a mix. Stop before
          // creating anything: an order made from a mixed basket would take the session's
          // idempotency key and leave the other items unfulfillable. A non-2xx reply asks Stripe
          // to retry, which is safe because nothing was created.
          console.error(
            '[merch-alert] checkout session mixes printers; no order was created',
            { sessionId: session.id }
          );
          return res.status(500).send();
        }
        if (newItems.length) {
          const shippingDetails =
            expandedSession.collected_information?.shipping_details;
          const shippingAddress = {
            name: shippingDetails?.name,
            line1: shippingDetails?.address.line1 ?? undefined,
            line2: shippingDetails?.address.line2 ?? undefined,
            city: shippingDetails?.address.city ?? undefined,
            stateCode: shippingDetails?.address.state ?? undefined,
            postalCode: shippingDetails?.address.postal_code ?? undefined,
            countryCode: shippingDetails?.address.country ?? undefined,
          };

          // The tote's fixed rate names no method, so a tote order keeps the field empty.
          const shippingRate = expandedSession.shipping_cost?.shipping_rate as
            Stripe.ShippingRate | undefined;
          let shippingMethod: string | undefined =
            shippingRate?.metadata?.[PRODIGI_SHIPPING_METHOD_METADATA_KEY];
          if (!shippingMethod && providers.has(MerchProvider.PRODIGI)) {
            console.warn(
              'Print checkout has no Prodigi shipping method; defaulting to Standard',
              { sessionId: session.id }
            );
            shippingMethod = 'Standard';
          }

          const order = await MerchOrderService.createMerchOrder(
            userId,
            session.id,
            shippingAddress,
            newItems,
            shippingMethod
          );

          console.log('Created merch order', order);
        }

        // Print purchases are not tips, so they do not earn credits. They are found from the
        // products on the session, so a print can never be credited because it was not turned
        // into an order item.
        const buysPrint = (expandedSession.line_items?.data ?? []).some(
          (lineItem) => {
            const variant = productMetadata(lineItem)['merch-internal-variant'];
            return !!variant && isPrintVariant(variant);
          }
        );
        if (!creditsLineItems.length && !buysPrint) {
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
      // Used to track active subscriptions
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const user = await UserService.getUserByStripeCustomerId(
          subscription.customer as string
        );
        if (!user) {
          console.warn('No user found for stripe customer id', subscription);
          return;
        }
        if (event.type === 'customer.subscription.deleted') {
          console.log('Subscription deleted', subscription);
          await UserService.updateSupportSubscription(user.id, null);
        } else if (
          subscription.status === 'active' &&
          user.stripeSupportSubscriptionId !== subscription.id
        ) {
          console.log('New subscription is active', subscription);
          await UserService.updateSupportSubscription(user.id, subscription.id);
        }
        break;
      }
    }
    res.status(200).send();
  }
);

export default router;
