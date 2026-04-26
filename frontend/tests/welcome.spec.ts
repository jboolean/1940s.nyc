import { test, expect } from '@playwright/test';

test('welcome screen displays and can be dismissed', async ({ page }) => {
  await page.goto('/');

  const modal = page.locator('[data-testid="welcome-modal"]');
  await expect(modal).toBeVisible();

  await expect(page.locator('[data-testid="welcome-heading"]')).toHaveText(
    'Street View of 1940s New York'
  );

  await expect(page.getByText('Every dot')).toBeVisible();

  const button = page
    .locator('[data-testid="start-exploring"]')
    .filter({ hasText: 'Start Exploring' })
    .first();
  await expect(button).toBeVisible();
  await button.click();

  await expect(modal).not.toBeVisible();
});
