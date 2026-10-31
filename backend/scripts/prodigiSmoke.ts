/**
 * Verifies the print catalog against a Prodigi environment and optionally creates a sandbox order.
 *
 *   PRODIGI_BASE_URL=<host> PRODIGI_SK=<key> npx tsx scripts/prodigiSmoke.ts [--order <photoIdentifier>]
 *
 * Without --order this only issues GET requests and quote requests, so it is safe against the live API.
 * --order creates (then cancels) one order per catalog product and is refused outside the sandbox.
 */
import type { Quote } from 'prodigi-print-api';
import { getAllPrintProducts } from '../src/business/prodigi/printCatalog';
import * as ProdigiService from '../src/business/prodigi/ProdigiService';
import { prodigiEnvironmentFromBaseUrl } from '../src/business/prodigi/prodigiConfig';

const SHIPPING_METHODS = ['Budget', 'Standard', 'Express', 'Overnight'];

async function verifyProduct(
  product: ReturnType<typeof getAllPrintProducts>[number]
): Promise<string[]> {
  const problems: string[] = [];
  const remote = await ProdigiService.getProduct(product.sku);
  const variant = remote.variants.find((v) =>
    Object.entries(product.attributes).every(
      ([k, val]) => v.attributes[k] === val
    )
  );
  if (!variant) {
    return [`no variant matching ${JSON.stringify(product.attributes)}`];
  }
  if (!variant.shipsTo.includes('US')) {
    problems.push('does not ship to US');
  }
  for (const attribute of Object.keys(remote.attributes)) {
    if (
      remote.attributes[attribute].length > 1 &&
      !(attribute in product.attributes)
    ) {
      problems.push(`attribute "${attribute}" has several values and is unset`);
    }
  }
  const area = variant.printAreaSizes.default;
  if (
    area.horizontalResolution !== product.printAreaPx.width ||
    area.verticalResolution !== product.printAreaPx.height
  ) {
    problems.push(
      `print area is ${area.horizontalResolution}x${area.verticalResolution}, catalog says ${product.printAreaPx.width}x${product.printAreaPx.height}`
    );
  }
  return problems;
}

async function main(): Promise<void> {
  const baseUrl = process.env.PRODIGI_BASE_URL ?? '';
  console.log('Environment:', prodigiEnvironmentFromBaseUrl(baseUrl));
  const orderPhoto = process.argv.includes('--order')
    ? process.argv[process.argv.indexOf('--order') + 1]
    : undefined;

  let failed = false;
  for (const product of getAllPrintProducts()) {
    const problems = await verifyProduct(product).catch((e: unknown) => [
      `lookup failed: ${String(e)}`,
    ]);
    const quotes = await ProdigiService.getQuotes({
      destinationCountryCode: 'US',
      items: [
        {
          sku: product.sku,
          copies: 1,
          attributes: product.attributes,
          assets: [{ printArea: 'default' }],
        },
      ],
    }).catch(() => [] as Quote[]);
    const costs = quotes
      .filter((q) => SHIPPING_METHODS.includes(q.shipmentMethod))
      .map((q) => `${q.shipmentMethod} ${q.costSummary.shipping.amount}`)
      .join(', ');
    const itemCost = quotes[0]?.costSummary.items.amount ?? '?';
    console.log(
      `${problems.length ? 'FAIL' : 'ok  '} ${product.variant} ${product.sku} item ${itemCost} | ${costs}`
    );
    problems.forEach((p) => console.log('     -', p));
    failed ||= problems.length > 0;
  }

  if (orderPhoto) {
    for (const product of getAllPrintProducts()) {
      const created = await ProdigiService.createOrder({
        merchantReference: `smoke-${product.variant}-${Date.now()}`,
        shippingMethod: 'Budget',
        recipient: {
          name: 'Sandbox Test',
          address: {
            line1: '1 Main St',
            townOrCity: 'New York',
            stateOrCounty: 'NY',
            postalOrZipCode: '10007',
            countryCode: 'US',
          },
        },
        items: [
          {
            sku: product.sku,
            copies: 1,
            sizing: product.sizing,
            attributes: product.attributes,
            assets: [
              {
                printArea: 'default',
                url: `https://photos.1940s.nyc/jpg/${orderPhoto}.jpg`,
              },
            ],
          },
        ],
      });
      console.log(
        'order',
        product.variant,
        created.id,
        created.status.stage,
        JSON.stringify(created.items[0].assets.map((a) => a.status))
      );
    }
  }

  process.exitCode = failed ? 1 : 0;
}

void main();
