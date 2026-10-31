/**
 * Creates the Stripe products for photo prints, keyed by internal variant id.
 *
 *   STRIPE_SK=<key> npx tsx scripts/setupPrintStripeProducts.ts [--all] [--verify]
 *
 * Creating is refused with a live-mode key. --verify only reads, so it is safe in live mode, and
 * reports whether every product exists with the expected price. Without --all only the variants
 * currently offered (the chosen paper family plus the framed print) are handled.
 */
import type Stripe from 'stripe';
import {
  getActivePrintProducts,
  getAllPrintProducts,
} from '../src/business/prodigi/printCatalog';
import { PRINT_PRICE_CENTS } from '../src/business/prodigi/printPricing';
import stripe from '../src/third-party/stripe';

async function main(): Promise<void> {
  const verifyOnly = process.argv.includes('--verify');
  const products = process.argv.includes('--all')
    ? getAllPrintProducts()
    : getActivePrintProducts();

  const { livemode } = await stripe.balance.retrieve();
  console.log(`Stripe mode: ${livemode ? 'LIVE' : 'test'}`);
  if (livemode && !verifyOnly) {
    throw new Error('Refusing to create products with a live-mode key');
  }

  let missing = false;
  for (const product of products) {
    const expected = PRINT_PRICE_CENTS[product.variant];
    let existing: Stripe.Product | undefined;
    try {
      existing = await stripe.products.retrieve(product.variant, {
        expand: ['default_price'],
      });
    } catch (e) {
      if ((e as { code?: string }).code !== 'resource_missing') {
        throw e;
      }
    }

    if (existing) {
      const price = existing.default_price as Stripe.Price | null;
      const ok = existing.active && price?.unit_amount === expected;
      console.log(
        `${ok ? 'ok     ' : 'MISMATCH'} ${product.variant} price ${price?.unit_amount} (expected ${expected}) active ${existing.active}`
      );
      missing ||= !ok;
      continue;
    }

    if (verifyOnly) {
      console.log(`MISSING  ${product.variant}`);
      missing = true;
      continue;
    }

    await stripe.products.create({
      id: product.variant,
      name: product.label,
      metadata: {
        'product-type': 'print',
        'merch-internal-variant': product.variant,
        'prodigi-sku': product.sku,
      },
      default_price_data: {
        currency: 'usd',
        unit_amount: expected,
        tax_behavior: 'unspecified',
      },
    });
    console.log(`created  ${product.variant} price ${expected}`);
  }

  process.exitCode = missing ? 1 : 0;
}

void main();
