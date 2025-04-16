import { BadRequest } from 'http-errors';
import type Stripe from 'stripe';
import User from '../../entities/User';
import TipFrequency from '../../enum/TipFrequency';
import stripe from '../../third-party/stripe';
import isProduction from '../utils/isProduction';
import * as GiftRegistry from './GiftRegistry';

const recurringForFrequency: Record<
  TipFrequency,
  Stripe.Checkout.SessionCreateParams.LineItem.PriceData['recurring']
> = {
  [TipFrequency.ONCE]: undefined,
  [TipFrequency.MONTHLY]: {
    interval: 'month',
    interval_count: 1,
  },
};

const RECURRING_PRODUCT_ID = isProduction() ? 'XXX' : 'prod_RqWpsbQnybLsmU';
const ONE_TIME_PRODUCT_ID = isProduction() ? 'XXX' : 'prod_RqWxloaBN1Gqnd';

export async function createTipCheckoutSession({
  amountMinorUnits: amount,
  successUrl,
  cancelUrl,
  user,
  frequency,
  gift: requestedGiftId,
}: {
  amountMinorUnits: number;
  successUrl: string;
  cancelUrl: string;
  user?: User;
  frequency: TipFrequency;
  gift?: GiftRegistry.Gift;
}): Promise<string> {
  console.log('Creating tip checkout session', user);
  const userId = user?.id;
  const stripeCustomerId: string | undefined =
    user?.stripeCustomerId ?? undefined;
  const hasExistingCustomer = !!stripeCustomerId;
  const isSubscription = frequency !== TipFrequency.ONCE;
  const gift = requestedGiftId
    ? GiftRegistry.getGift(requestedGiftId, frequency, amount)
    : undefined;
  const hasGift = !!gift;

  if (isSubscription && user?.stripeSupportSubscriptionId) {
    throw new BadRequest('There is already a subscription for this user');
  }

  const session = await stripe.checkout.sessions.create(
    {
      cancel_url: cancelUrl,
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: successUrl,
      line_items: [
        {
          price_data: {
            currency: 'USD',
            product: isSubscription
              ? RECURRING_PRODUCT_ID
              : ONE_TIME_PRODUCT_ID,
            unit_amount: amount,
            recurring: recurringForFrequency[frequency],
          },
          quantity: 1,
        },
        ...(hasGift
          ? [
              {
                price: gift.stripePrice,
                quantity: 1,
              },
              // Shipping charge, because Stripe doesn't support shipping charges on subscriptions
              ...(isSubscription
                ? [
                    {
                      price: gift.stripeShippingPrice,
                      quantity: 1,
                    },
                  ]
                : []),
            ]
          : []),
      ],
      metadata: {
        userId: userId ?? null,
      },
      customer: stripeCustomerId,
      // History: Stripe used to always create a customer, then it started creating "guest customers" instead (annoying!). This is to force it to always create a customer which we can attach to the user in the webhook.
      // Not allow to pass parameter in subscription mode
      customer_creation:
        hasExistingCustomer || isSubscription ? undefined : 'always',
      customer_email: hasExistingCustomer
        ? undefined
        : user?.email ?? undefined,
      payment_intent_data: {},
      shipping_address_collection: hasGift
        ? {
            allowed_countries: ['US'],
          }
        : undefined,
      // This is not allowed for subscription mode, a line item will be used instead
      shipping_options:
        hasGift && !isSubscription
          ? [
              {
                shipping_rate: gift.stripeShippingRate,
              },
            ]
          : undefined,
    },
    undefined
  );

  return session.id;
}

export async function createCustomerPortalSession(
  user: User,
  returnUrl: string
): Promise<string> {
  const stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    throw new BadRequest('User has no Stripe account');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}
