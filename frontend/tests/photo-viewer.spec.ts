import { test, expect } from '@playwright/test';
import { PhotoViewerPage } from './pages/PhotoViewerPage';
import {
  DEFAULT_PHOTO,
  DEFAULT_PHOTO_HASH,
  PHOTO_WITH_STORIES,
  PHOTO_WITH_STORIES_HASH,
  url,
} from './helpers';

test('hover to see alternates; click one changes photo ID but preserves hash and keeps viewer open', async ({ page }) => {
  await page.goto(
    url(`/map/photo/${DEFAULT_PHOTO}`, {
      noWelcome: true,
      noTipJar: true,
      hash: DEFAULT_PHOTO_HASH,
    })
  );
  const viewer = new PhotoViewerPage(page);
  await viewer.revealOverlay();
  await expect(page.locator('[data-testid="alternates"]')).toBeVisible();
  const urlBefore = page.url();
  const hashBefore = new URL(page.url()).hash;
  await viewer.clickFirstAlternate();
  await page.waitForFunction(
    (before: string) => window.location.href !== before,
    urlBefore,
    { timeout: 10000 }
  );
  await page.waitForFunction(
    (expectedHash: string) => window.location.hash === expectedHash,
    hashBefore,
    { timeout: 5000 }
  );
  expect(page.url()).not.toContain(DEFAULT_PHOTO);
  expect(new URL(page.url()).hash).toBe(hashBefore);
  // Viewer must stay open and URL must remain under /map/photo/
  expect(page.url()).toContain('/map/photo/');
  await expect(viewer.pane()).toBeVisible();
});

test('stories shown on hover', async ({ page }) => {
  await page.goto(
    url(`/map/photo/${PHOTO_WITH_STORIES}`, {
      noWelcome: true,
      noTipJar: true,
      hash: PHOTO_WITH_STORIES_HASH,
    })
  );
  const viewer = new PhotoViewerPage(page);
  await viewer.revealOverlay();
  await expect(viewer.stories()).toBeVisible();
});

test('order prints opens the print modal', async ({ page }) => {
  await page.goto(
    url(`/map/photo/${DEFAULT_PHOTO}`, {
      noWelcome: true,
      noTipJar: true,
      hash: DEFAULT_PHOTO_HASH,
    })
  );
  const viewer = new PhotoViewerPage(page);
  await viewer.revealOverlay();
  await viewer.clickOrderPrint();
  await expect(page.locator('[data-testid="print-modal"]')).toBeVisible();
});
