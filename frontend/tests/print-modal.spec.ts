import { expect, Page, test } from '@playwright/test';
import { expectStripeRedirect, url } from './helpers';

const PHOTO_1940 = 'nynyma_rec0040_1_00581_0063';
const PHOTO_1980 = 'nynyma_rec0040_1_00581_0064';
const PHOTO_HASH = '#17.5/40.729011/-74.005661';

const PRODUCTS = [
  { variant: 'print-hpr-4x6', label: '4×6 print', priceAmount: 900 },
  { variant: 'print-hpr-8x12', label: '8×12 print', priceAmount: 1900 },
  {
    variant: 'print-fap-8x12-framed',
    label: '8×12 framed print',
    priceAmount: 5900,
  },
];

const CHECKOUT_URL = 'https://checkout.stripe.com/c/pay/cs_test_print';

async function stubPrintApi(page: Page, identifier: string): Promise<void> {
  await page.route(`**/photos/${identifier}`, (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        identifier,
        collection: identifier === PHOTO_1980 ? '1980' : '1940',
        address: '1 Main St',
        borough: 'Manhattan',
        effectiveGeocode: {
          method: 'lookup',
          lngLat: { lng: -74.005661, lat: 40.729011 },
        },
      }),
    })
  );
  await page.route('**/print-checkout/available-products', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(PRODUCTS),
    })
  );
  await page.route('**/stories*', (route) =>
    route.fulfill({ contentType: 'application/json', body: '{"items":[]}' })
  );
}

async function openPrintModal(page: Page, identifier: string): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem(
      'featureFlags',
      JSON.stringify({ state: { 'print-orders': true }, version: 0 })
    );
  });
  await stubPrintApi(page, identifier);
  await page.goto(
    url(`/map/photo/${identifier}`, {
      noWelcome: true,
      noTipJar: true,
      hash: PHOTO_HASH,
    })
  );
  await page.locator('[data-testid="viewer-pane"]').hover();
  await page.locator('[data-testid="order-print-button"]').click();
  await expect(page.locator('[data-testid="print-modal"]')).toBeVisible();
}

async function stubCheckoutSession(page: Page, delayMs = 0): Promise<void> {
  await page.route('**/print-checkout/session', async (route) => {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ sessionId: 'cs_test_print', url: CHECKOUT_URL }),
    });
  });
}

test('print modal — the product select fits the longest label and shows keyboard focus', async ({
  page,
}) => {
  await openPrintModal(page, PHOTO_1940);

  const select = page.locator('[data-testid="print-product-select"]');
  await select.selectOption('print-fap-8x12-framed');
  const widestLabelFits = await select.evaluate((element) => {
    const el = element as HTMLSelectElement;
    const style = getComputedStyle(el);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const widest = Math.max(
      ...[...el.options].map((option) => context.measureText(option.text).width)
    );
    const contentWidth =
      el.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight);
    return widest <= contentWidth;
  });
  expect(widestLabelFits).toBe(true);

  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    const isFocused = await select.evaluate(
      (el) => el === document.activeElement
    );
    if (isFocused) break;
  }
  await expect(select).toBeFocused();
  const outlineWidth = await select.evaluate(
    (el) => getComputedStyle(el).outlineWidth
  );
  expect(outlineWidth).not.toBe('0px');
});

test('print modal — a 1980s photo sizes the modal to its content', async ({
  page,
}) => {
  await openPrintModal(page, PHOTO_1980);

  await expect(page.locator('[data-testid="archives-card"]')).toBeVisible();
  await expect(
    page.locator('[data-testid="print-product-select"]')
  ).toHaveCount(0);
  const modalBox = await page
    .locator('[data-testid="print-modal"]')
    .boundingBox();
  expect(modalBox?.height).toBeLessThan(400);
});

test('print modal — the product, quantity and colorize options set the order', async ({
  page,
}) => {
  await openPrintModal(page, PHOTO_1940);

  const total = page.locator('[data-testid="print-total"]');
  await expect(total).toHaveText('$9');

  await page
    .locator('[data-testid="print-product-select"]')
    .selectOption('print-fap-8x12-framed');
  await expect(total).toHaveText('$59');

  await page.locator('[data-testid="print-quantity-input"]').fill('3');
  await expect(total).toHaveText('$177');

  const colorize = page.locator('[data-testid="print-colorize-checkbox"]');
  await expect(colorize).not.toBeChecked();
  await colorize.check();
  await expect(colorize).toBeChecked();
});

test('print modal — checkout goes to Stripe', async ({ page }) => {
  await openPrintModal(page, PHOTO_1940);
  await stubCheckoutSession(page);

  await page.locator('[data-testid="print-checkout-button"]').click();
  await expectStripeRedirect(page);
});

test('print modal — closing while the session is created does not go to Stripe', async ({
  page,
}) => {
  await openPrintModal(page, PHOTO_1940);
  await stubCheckoutSession(page, 1000);

  const sessionCreated = page.waitForResponse('**/print-checkout/session');
  await page.locator('[data-testid="print-checkout-button"]').click();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.locator('[data-testid="print-modal"]')).toBeHidden();

  await sessionCreated;
  await page.waitForTimeout(1000);
  expect(page.url()).not.toContain('stripe.com');
});

test('print modal — returning from Stripe shows the order placed screen', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'featureFlags',
      JSON.stringify({ state: { 'print-orders': true }, version: 0 })
    );
  });
  await stubPrintApi(page, PHOTO_1940);
  await page.goto(
    url(`/map/photo/${PHOTO_1940}`, {
      noWelcome: true,
      noTipJar: true,
      extra: `printSuccess=${encodeURIComponent(PHOTO_HASH)}`,
      hash: PHOTO_HASH,
    })
  );

  await expect(
    page.locator('[data-testid="print-order-placed"]')
  ).toBeVisible();
});

test('print modal — the order placed screen needs print orders to be enabled', async ({
  page,
}) => {
  await stubPrintApi(page, PHOTO_1940);
  await page.goto(
    url(`/map/photo/${PHOTO_1940}`, {
      noWelcome: true,
      noTipJar: true,
      extra: `printSuccess=${encodeURIComponent(PHOTO_HASH)}`,
      hash: PHOTO_HASH,
    })
  );

  await expect(page.locator('[data-testid="print-order-placed"]')).toHaveCount(
    0
  );
});
