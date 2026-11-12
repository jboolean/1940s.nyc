import { setTimeout } from 'node:timers/promises';
import * as WhccClient from './whccApi';

const POLL_START_MS = 1_000;
const POLL_MAX_MS = 3_000;

// Builds the products and waits until each is ready. Throws at the deadline (epoch milliseconds).
// Results keep the input order.
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
