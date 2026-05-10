import { test, expect } from '@playwright/test';
import { DEFAULT_PHOTO, DEFAULT_PHOTO_HASH, url } from './helpers';

test('colorize payment flow opens via ?openCreditPurchase', async ({ page }) => {
  await page.goto(
    url(`/map/photo/${DEFAULT_PHOTO}`, {
      noWelcome: true,
      noTipJar: true,
      extra: 'openCreditPurchase',
      hash: DEFAULT_PHOTO_HASH,
    })
  );
  await expect(
    page.locator('[data-testid="credit-purchase-modal"]')
  ).toBeVisible();
});