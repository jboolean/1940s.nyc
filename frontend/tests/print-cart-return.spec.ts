import { expect, Page, test } from '@playwright/test';
import { url } from './helpers';

const HASH = '#17.5/40.729011/-74.005661';

const CART = [
  {
    photoIdentifier: 'nynyma_rec0040_1_00581_0063',
    variant: 'print-hpr-4x6',
    colorize: false,
    quantity: 2,
  },
];

async function openWithCart(page: Page, extra: string): Promise<void> {
  await page.addInitScript((items) => {
    // Seed only on the first load, so a reload inside the test sees what the app saved.
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem(
      'featureFlags',
      JSON.stringify({ state: { 'print-orders': true }, version: 0 })
    );
    localStorage.setItem(
      'print-cart',
      JSON.stringify({ state: { items, savedAt: Date.now() }, version: 0 })
    );
  }, CART);
  await page.goto(
    url('/map', { noWelcome: true, noTipJar: true, extra, hash: HASH })
  );
}

const storedItems = (page: Page): Promise<unknown[]> =>
  page.evaluate(
    () =>
      (
        JSON.parse(localStorage.getItem('print-cart') ?? '{}') as {
          state?: { items?: unknown[] };
        }
      ).state?.items ?? []
  );

test('returning from a paid cart checkout thanks the buyer and empties the cart', async ({
  page,
}) => {
  await openWithCart(page, 'printSuccess=cart');

  await expect(
    page.locator('[data-testid="print-order-placed"]')
  ).toBeVisible();
  await expect(page.locator('[data-testid="print-cart-button"]')).toHaveCount(
    0
  );
  expect(await storedItems(page)).toEqual([]);

  await page.reload();
  await expect(page.locator('[data-testid="print-cart-button"]')).toHaveCount(
    0
  );
});

test('returning from a paid buy-now checkout leaves the cart alone', async ({
  page,
}) => {
  await openWithCart(page, 'printSuccess=');

  await expect(
    page.locator('[data-testid="print-order-placed"]')
  ).toBeVisible();
  expect(await storedItems(page)).toHaveLength(1);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.locator('[data-testid="print-cart-button"]')).toBeVisible();
});

test('cancelling a checkout leaves the cart alone and shows no thank-you', async ({
  page,
}) => {
  await openWithCart(page, '');

  await expect(page.locator('[data-testid="print-cart-button"]')).toBeVisible();
  await expect(page.locator('[data-testid="print-order-placed"]')).toHaveCount(
    0
  );
  expect(await storedItems(page)).toHaveLength(1);
});
