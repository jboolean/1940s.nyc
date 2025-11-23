import User from '../../entities/User';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import stripe from '../../third-party/stripe';
import isProduction from '../utils/isProduction';
import { MERCH_PRODUCT_IDS } from './ProductRegistry';

// This is the tote bag US price.
// To do international or other products at correct rates, this should be made dynamic.
const DEFAULT_SHIPPING_RATE = isProduction()
  ? 'shr_1SWhRLFCLBtNZLVlvrC9UTEd'
  : 'shr_1QssVnFCLBtNZLVlK1TZpXet';

export async function createMerchCheckoutSession({
  successUrl,
  cancelUrl,
  user,
  items,
}: {
  successUrl: string;
  cancelUrl: string;
  user?: User;
  items: { variant: MerchInternalVariant; quantity: number }[];
}): Promise<{ sessionId: string; url: string }> {
  const userId = user?.id;
  const stripeCustomerId: string | undefined =
    user?.stripeCustomerId ?? undefined;
  const hasExistingCustomer = !!stripeCustomerId;

  const session = await stripe.checkout.sessions.create(
    {
      cancel_url: cancelUrl,
      mode: 'payment',
      success_url: successUrl,
      line_items: await Promise.all(
        items.map(async (item) => ({
          price: await stripe.products
            .retrieve(MERCH_PRODUCT_IDS[item.variant])
            .then((product) => product.default_price as string),
          quantity: item.quantity,
        }))
      ),
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
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      shipping_options: [
        {
          shipping_rate: DEFAULT_SHIPPING_RATE,
        },
      ],
    },
    undefined
  );

  return { sessionId: session.id, url: session.url as string };
}
