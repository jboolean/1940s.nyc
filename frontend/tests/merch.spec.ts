import { test, expect } from '@playwright/test';
import { MerchModal } from './pages/MerchModal';
import { expectStripeRedirect, url } from './helpers';

test('shop modal — checkout → Stripe', async ({ page }) => {
  await page.goto(url('/map', { noWelcome: true, noTipJar: true }));
  await page.getByRole('button', { name: 'Shop!' }).click();
  const merch = new MerchModal(page);
  await expect(merch.modal()).toBeVisible();
  await merch.checkout();
  await expectStripeRedirect(page);
});