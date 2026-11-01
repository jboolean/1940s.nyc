import { BadRequest, NotFound } from 'http-errors';
import { AppDataSource } from '../../createConnection';
import Photo from '../../entities/Photo';
import User from '../../entities/User';
import Collection from '../../enum/Collection';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import stripe from '../../third-party/stripe';
import {
  buildCheckoutSessionFields,
  getCatalogDefaultPrice,
} from '../merch/checkoutSession';
import { getMerchLabel } from '../merch/merchCatalog';
import required from '../utils/required';
import { getActivePrintProducts, PrintProduct } from './printCatalog';
import * as ProdigiService from './ProdigiService';
import { buildShippingOptions } from './printShipping';

const MAX_QUANTITY = 10;

export const PRINT_PRODUCT_TYPE = 'print';

export interface AvailablePrintProduct {
  variant: MerchInternalVariant;
  label: string;
  priceAmount: number;
}

// The Stripe product is keyed by the internal variant id and its default price is the source of
// truth. The customization choices are per purchase, so they travel on the line item's own
// metadata rather than on the product.
export async function getAvailablePrintProducts(): Promise<
  AvailablePrintProduct[]
> {
  return Promise.all(
    PRINT_PRODUCTS.map(async (product) => ({
      variant: product.variant,
      label: getMerchLabel(product.variant),
      priceAmount: required(
        (await getCatalogDefaultPrice(product.variant)).unit_amount,
        `unit_amount of ${product.variant}`
      ),
    }))
  );
}

export async function createPrintCheckoutSession({
  successUrl,
  cancelUrl,
  user,
  photoIdentifier,
  variant,
  quantity,
  colorize,
}: {
  successUrl: string;
  cancelUrl: string;
  user?: User;
  photoIdentifier: string;
  variant: MerchInternalVariant;
  quantity: number;
  colorize: boolean;
}): Promise<{ sessionId: string; url: string }> {
  const product = PRINT_PRODUCTS.find((p) => p.variant === variant);
  if (!product) {
    throw new BadRequest(`${variant} is not available`);
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw new BadRequest(`Quantity must be between 1 and ${MAX_QUANTITY}`);
  }

  const photo = await AppDataSource.getRepository(Photo).findOne({
    where: { identifier: photoIdentifier },
    relations: { effectiveAddress: true },
  });
  if (!photo) {
    throw new NotFound('Photo not found');
  }
  if (photo.collection !== Collection.FOURTIES) {
    throw new BadRequest('Prints are only available for 1940s photos');
  }

  // The price comes from Stripe; it is read here so a missing or non-USD price fails now, not at
  // the webhook.
  const [price, quotes] = await Promise.all([
    getCatalogDefaultPrice(product.variant),
    ProdigiService.getQuotes({
      destinationCountryCode: 'US',
      items: [
        {
          sku: product.sku,
          copies: quantity,
          attributes: product.attributes,
          assets: [{ printArea: 'default' }],
        },
      ],
    }),
  ]);
  const shippingOptions = buildShippingOptions(quotes);
  if (!shippingOptions.length) {
    throw new Error(`Prodigi returned no shipping options for ${product.sku}`);
  }

  const address = photo.effectiveAddress?.address;

  const session = await stripe.checkout.sessions.create({
    ...buildCheckoutSessionFields({ successUrl, cancelUrl, user }),
    mode: 'payment',
    line_items: [
      {
        price: price.id,
        quantity,
        metadata: {
          'photo-identifier': photo.identifier,
          colorize: String(colorize),
          description: address
            ? `${address}, ${photo.borough ?? 'NYC'} (1940s tax photo)`
            : `1940s tax photo ${photo.identifier}`,
        },
      },
    ],
    shipping_options: shippingOptions,
  });

  return { sessionId: session.id, url: session.url as string };
}
