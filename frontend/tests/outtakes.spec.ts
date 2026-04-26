import { test, expect } from '@playwright/test';
import { url } from './helpers';

test('outtakes gallery loads; clicking a photo opens the viewer', async ({ page }) => {
  await page.goto(url('/outtakes', { noWelcome: true, noTipJar: true }));
  await expect(page.locator('[data-testid="outtakes-page"]')).toBeVisible();
  // Grid loads items via API — wait for at least one photo to appear
  await expect(
    page.locator('[data-testid="outtake-photo"]').first()
  ).toBeVisible({ timeout: 15_000 });
  await page.locator('[data-testid="outtake-photo"]').first().click();
  await page.waitForURL(/\/outtakes\/photo\//);
});