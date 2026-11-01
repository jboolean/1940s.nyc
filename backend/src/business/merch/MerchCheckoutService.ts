import { BadRequest } from 'http-errors';
import User from '../../entities/User';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import stripe from '../../third-party/stripe';
import isProduction from '../utils/isProduction';
import {
  buildCheckoutSessionFields,
  getCatalogDefaultPrice,
} from './checkoutSession';
import { getMerchProductId, hasMerchProduct } from './ProductRegistry';

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
  const unsupported = items.find((item) => !hasMerchProduct(item.variant));
  if (unsupported) {
    throw new BadRequest(
      `${unsupported.variant} cannot be bought with this checkout`
    );
  }

  const session = await stripe.checkout.sessions.create(
    {
      ...buildCheckoutSessionFields({ successUrl, cancelUrl, user }),
      mode: 'payment',
      line_items: await Promise.all(
        items.map(async (item) => ({
          price: (await getCatalogDefaultPrice(getMerchProductId(item.variant)))
            .id,
          quantity: item.quantity,
        }))
      ),
      payment_intent_data: {},
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
