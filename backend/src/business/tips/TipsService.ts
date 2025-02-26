import User from '../../entities/User';
import stripe from '../../third-party/stripe';

export async function createTipCheckoutSession({
  amountMinorUnits: amount,
  successUrl,
  cancelUrl,
  user,
}: {
  amountMinorUnits: number;
  successUrl: string;
  cancelUrl: string;
  user?: User;
}): Promise<string> {
  const userId = user?.id;
  const stripeCustomerId: string | undefined =
    user?.stripeCustomerId ?? undefined;
  const hasExistingCustomer = !!stripeCustomerId;
  const session = await stripe.checkout.sessions.create(
    {
      cancel_url: cancelUrl,
      mode: 'payment',
      success_url: successUrl,
      line_items: [
        {
          price_data: {
            currency: 'USD',
            product_data: {
              name: 'Tip for 1940s.nyc',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId ?? null,
      },
      customer: stripeCustomerId,
      // History: Stripe used to always create a customer, then it started creating "guest customers" instead (annoying!). This is to force it to always create a customer which we can attach to the user in the webhook.
      customer_creation: hasExistingCustomer ? undefined : 'always',
      customer_email: hasExistingCustomer
        ? undefined
        : user?.email ?? undefined,
      payment_intent_data: {},
    },
    undefined
  );

  return session.id;
}
