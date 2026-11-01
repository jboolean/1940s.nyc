import { expect, Page, test } from '@playwright/test';
import { url } from './helpers';

// An order with a tote (no options) and a print that has not been customized yet (no options),
// alongside a customized print so the colorized suffix is exercised.
const ORDERS = [
  {
    id: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    userId: 1,
    state: 'building',
    items: [
      {
        id: 11,
        internalVariant: 'tote-bag-small',
        label: 'Tote bag',
        state: 'purchased',
      },
      {
        id: 12,
        internalVariant: 'print-hpr-8x12',
        label: '8×12 print',
        state: 'purchased',
      },
      {
        id: 13,
        internalVariant: 'print-hpr-4x6',
        label: '4×6 print',
        customizationOptions: {
          variant: 'print-hpr-4x6',
          photoIdentifier: 'nynyma_rec0040_1_00581_0063',
          colorize: true,
        },
        state: 'customized',
      },
    ],
  },
];

async function stubOrders(page: Page): Promise<void> {
  await page.route('**/merch/orders', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(ORDERS),
    })
  );
  await page.route('**/authentication/me', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ email: null }),
    })
  );
}

test('orders — an item with no print options does not take the page down', async ({
  page,
}) => {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  await stubOrders(page);

  await page.goto(url('/orders', { noWelcome: true, noTipJar: true }));

  await expect(page.locator('[data-item-id="11"]')).toBeVisible();
  await expect(page.locator('[data-item-id="12"]')).toBeVisible();
  await expect(page.locator('[data-item-id="13"]')).toBeVisible();
  await expect(page.locator('[data-item-id="11"] h3')).not.toContainText(
    'AI colorized'
  );
  await expect(page.locator('[data-item-id="13"] h3')).toContainText(
    'AI colorized'
  );
  expect(errors).toEqual([]);
});
