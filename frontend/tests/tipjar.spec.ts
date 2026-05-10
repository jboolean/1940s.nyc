import { test, expect } from '@playwright/test';
import { TipJarModal } from './pages/TipJarModal';
import { expectStripeRedirect, url } from './helpers';

test('tip jar — select preset → submit → Stripe', async ({ page }) => {
  await page.goto(url('/map', { noWelcome: true }));
  await page.locator('[data-test="tip-me-button"]').click();
  const tipJar = new TipJarModal(page);
  await expect(tipJar.modal()).toBeVisible();
  await tipJar.selectFrequency('one-time');
  await tipJar.selectPreset(0);
  await tipJar.submit();
  await expectStripeRedirect(page);
});