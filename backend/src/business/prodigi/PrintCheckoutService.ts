import { BadRequest, NotFound } from 'http-errors';
import type Stripe from 'stripe';
import { AppDataSource } from '../../createConnection';
import Photo from '../../entities/Photo';
import User from '../../entities/User';
import Collection from '../../enum/Collection';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import stripe from '../../third-party/stripe';
import { bypassCloudflare } from '../utils/cloudflareOrigins';
import required from '../utils/required';
import { getActivePrintProducts, PrintProduct } from './printCatalog';
import * as ProdigiService from './ProdigiService';
import { buildShippingOptions } from './printShipping';

const MAX_QUANTITY = 10;

export const PRINT_PRODUCT_TYPE = 'print';

export interface AvailablePrintProduct {
  variant: MerchInternalVariant;
  label: string;
  framed: boolean;
  priceAmount: number;
}

export function getThumbnailUrl(photoIdentifier: string): string {
  return bypassCloudflare(
    `https://photos.1940s.nyc/720-jpg/${photoIdentifier}.jpg`
  );
}

// The Stripe product is keyed by the internal variant id and its default price is the source of truth.
async function getUnitAmount(product: PrintProduct): Promise<number> {
  const stripeProduct = await stripe.products.retrieve(product.variant, {
    expand: ['default_price'],
  });
  const price = required(
    stripeProduct.default_price as Stripe.Price | null,
    `default price of ${product.variant}`
  );
  return required(price.unit_amount, `unit_amount of ${product.variant}`);
}

export async function getAvailablePrintProducts(): Promise<
  AvailablePrintProduct[]
> {
  return Promise.all(
    getActivePrintProducts().map(async (product) => ({
      variant: product.variant,
      label: product.label,
      framed: product.framed,
      priceAmount: await getUnitAmount(product),
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
  const product = getActivePrintProducts().find((p) => p.variant === variant);
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

  const [unitAmount, quotes] = await Promise.all([
    getUnitAmount(product),
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
  const stripeCustomerId: string | undefined =
    user?.stripeCustomerId ?? undefined;

  const session = await stripe.checkout.sessions.create({
    cancel_url: cancelUrl,
    success_url: successUrl,
    mode: 'payment',
    line_items: [
      {
        quantity,
        price_data: {
          currency: 'usd',
          unit_amount: unitAmount,
          product_data: {
            name: colorize ? `${product.label}, AI colorized` : product.label,
            description: address
              ? `${address}, ${photo.borough ?? 'NYC'} (1940s tax photo)`
              : `1940s tax photo ${photo.identifier}`,
            images: [getThumbnailUrl(photo.identifier)],
            metadata: {
              'product-type': PRINT_PRODUCT_TYPE,
              'merch-internal-variant': product.variant,
              'photo-identifier': photo.identifier,
              colorize: String(colorize),
            },
          },
        },
      },
    ],
    metadata: { userId: user?.id ?? null },
    customer: stripeCustomerId,
    // See MerchCheckoutService: forces a customer so the webhook can attach it to the user.
    customer_creation: stripeCustomerId ? undefined : 'always',
    customer_email: stripeCustomerId ? undefined : (user?.email ?? undefined),
    shipping_address_collection: { allowed_countries: ['US'] },
    shipping_options: shippingOptions,
  });

  return { sessionId: session.id, url: session.url as string };
}
