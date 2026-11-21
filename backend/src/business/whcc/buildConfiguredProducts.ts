import { setTimeout } from 'node:timers/promises';
import * as WhccClient from './whccApi';

const POLL_START_MS = 1_000;
const POLL_MAX_MS = 3_000;

// Builds the products and waits until each is ready. Throws at the deadline (epoch milliseconds).
// Results follow the order WHCC returns them in, which can differ from the input order.
export async function buildConfiguredProducts(
  products: WhccClient.ConfiguredProductRequest[],
  deadline: number
): Promise<WhccClient.ConfiguredProduct[]> {
  const created = await WhccClient.createConfiguredProducts(products, deadline);
  const ids = created.items.map((i) => i.configuredProductId);
  let items = created.items;
  let delay = POLL_START_MS;
  let pollUrl = created.pollUrl;

  while (items.some((i) => i.status === 'processing')) {
    if (!pollUrl || Date.now() + delay > deadline) {
      throw new Error(`WHCC did not finish building ${ids.join(',')} in time`);
    }
    await setTimeout(delay);
    delay = Math.min(delay * 2, POLL_MAX_MS);
    const polled = await WhccClient.pollConfiguredProducts(pollUrl, deadline);
    items = polled.items;
    pollUrl = polled.pollUrl ?? pollUrl;
  }

  const failed = items.filter((i) => i.status !== 'ready');
  if (failed.length) {
    throw new Error(
      `WHCC could not build ${failed
        .map(
          (i) =>
            `${i.configuredProductId} (${i.status}): ${JSON.stringify(i.validationSummary)}`
        )
        .join('; ')}`
    );
  }
  return ids.map(
    (id) =>
      items.find(
        (i) => i.configuredProductId === id
      ) as WhccClient.ConfiguredProduct
  );
}

// Like buildConfiguredProducts, but results always match the input order. WHCC returns the products
// of one create call in any order and echoes nothing that ties them to the request, so each product
// gets its own create call.
export function buildConfiguredProductsInOrder(
  products: WhccClient.ConfiguredProductRequest[],
  deadline: number
): Promise<WhccClient.ConfiguredProduct[]> {
  return Promise.all(
    products.map(async (product) => {
      const built = await buildConfiguredProducts([product], deadline);
      if (built.length !== 1) {
        throw new Error(
          `WHCC returned ${built.length} products for one request`
        );
      }
      return built[0];
    })
  );
}
