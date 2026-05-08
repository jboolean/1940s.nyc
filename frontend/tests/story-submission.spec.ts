import { test, expect } from '@playwright/test';
import { PhotoViewerPage } from './pages/PhotoViewerPage';
import { DEFAULT_PHOTO, DEFAULT_PHOTO_HASH, url } from './helpers';

test('submit story wizard — all four steps to thank-you', async ({ page }) => {
  await page.goto(
    url(`/map/photo/${DEFAULT_PHOTO}`, {
      noWelcome: true,
      noTipJar: true,
      hash: DEFAULT_PHOTO_HASH,
    })
  );
  const viewer = new PhotoViewerPage(page);
  await viewer.revealOverlay();
  await viewer.clickKnowThisPlace();
  await expect(
    page.locator('[data-testid="submit-story-modal"]')
  ).toBeVisible();

  // Modal may open at TEXT_CONTENT step directly, so Write button may not exist.
  // If there's a text area, we're already at the content step.
  const textArea = page.locator('[data-testid="story-text-area"]');
  await expect(textArea).toBeVisible();
  await textArea.fill('Playwright test story');
  await page.locator('[data-testid="story-continue-button"]').click();
  await page
    .locator('[data-testid="story-name-input"]')
    .fill('Test User');
  await page
    .locator('[data-testid="story-subtitle-input"]')
    .fill('Former resident');
  await page
    .locator('[data-testid="story-email-input"]')
    .fill('playwright-test@example.com');
  await page.locator('[data-testid="story-submit-button"]').click();
  await expect(
    page.locator('[data-testid="story-thank-you"]')
  ).toBeVisible();
});