import { BadRequest, NotFound } from 'http-errors';
import type Stripe from 'stripe';
import { AppDataSource } from '../../createConnection';
import Photo from '../../entities/Photo';
import User from '../../entities/User';
import Collection from '../../enum/Collection';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import MerchProvider from '../../enum/MerchProvider';
import stripe from '../../third-party/stripe';
import { quotePrintShipping } from '../prodigi/printShipping';
import isProduction from '../utils/isProduction';
import {
  buildCheckoutSessionFields,
  getCatalogDefaultPrice,
} from './checkoutSession';
import { getMerchProvider, isPrintVariant } from './merchCatalog';
import { getMerchProductId, hasMerchProduct } from './ProductRegistry';

// This is the tote bag US price.
// To do international or other products at correct rates, this should be made dynamic.
const DEFAULT_SHIPPING_RATE = isProduction()
  ? 'shr_1SWhRLFCLBtNZLVlvrC9UTEd'
  : 'shr_1QssVnFCLBtNZLVlK1TZpXet';

const MAX_PRINT_QUANTITY = 10;
export const MAX_CHECKOUT_ITEMS = 20;

export interface CheckoutItem {
  variant: MerchInternalVariant;
  quantity: number;
  // A print is of one photo, chosen at checkout, so it carries the photo with it.
  print?: { photoIdentifier: string; colorize: boolean };
}

// The customization choices are per purchase, so they ride on the line item's own metadata, which
// the webhook reads back to build the order item.
async function describePrint({
  photoIdentifier,
  colorize,
}: NonNullable<CheckoutItem['print']>): Promise<Stripe.MetadataParam> {
  const photo = await AppDataSource.getRepository(Photo).findOne({
    where: { identifier: photoIdentifier },
  });
  if (!photo) {
    throw new NotFound('Photo not found');
  }
  if (photo.collection !== Collection.FOURTIES) {
    throw new BadRequest('Prints are only available for 1940s photos');
  }
  return {
    'photo-identifier': photo.identifier,
    colorize: String(colorize),
  };
}

function checkItem(item: CheckoutItem): void {
  if (!hasMerchProduct(item.variant)) {
    throw new BadRequest(`${item.variant} cannot be bought with this checkout`);
  }
  if (isPrintVariant(item.variant) !== !!item.print) {
    throw new BadRequest(
      isPrintVariant(item.variant)
        ? `${item.variant} needs a photo`
        : `${item.variant} is not a print`
    );
  }
  if (
    item.print &&
    (!Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > MAX_PRINT_QUANTITY)
  ) {
    throw new BadRequest(
      `Quantity must be between 1 and ${MAX_PRINT_QUANTITY}`
    );
  }
}

export async function createMerchCheckoutSession({
  successUrl,
  cancelUrl,
  user,
  items,
}: {
  successUrl: string;
  cancelUrl: string;
  user?: User;
  items: CheckoutItem[];
}): Promise<{ sessionId: string; url: string }> {
  if (items.length < 1 || items.length > MAX_CHECKOUT_ITEMS) {
    throw new BadRequest(
      `A checkout needs between 1 and ${MAX_CHECKOUT_ITEMS} items`
    );
  }
  items.forEach(checkItem);
  const providers = new Set(
    items.map((item) => getMerchProvider(item.variant))
  );
  if (providers.size > 1) {
    throw new BadRequest('One checkout can only buy from one printer');
  }

  // The prices come from Stripe; they are read here so a missing or non-USD price fails now, not
  // at the webhook.
  const [lineItems, shippingOptions] = await Promise.all([
    Promise.all(
      items.map(
        async (
          item
        ): Promise<Stripe.Checkout.SessionCreateParams.LineItem> => ({
          price: (await getCatalogDefaultPrice(getMerchProductId(item.variant)))
            .id,
          quantity: item.quantity,
          ...(item.print ? { metadata: await describePrint(item.print) } : {}),
        })
      )
    ),
    providers.has(MerchProvider.PRODIGI)
      ? quotePrintShipping(items)
      : [{ shipping_rate: DEFAULT_SHIPPING_RATE }],
  ]);

  const session = await stripe.checkout.sessions.create(
    {
      ...buildCheckoutSessionFields({ successUrl, cancelUrl, user }),
      mode: 'payment',
      line_items: lineItems,
      payment_intent_data: {},
      shipping_options: shippingOptions,
    },
    undefined
  );

  return { sessionId: session.id, url: session.url as string };
}
