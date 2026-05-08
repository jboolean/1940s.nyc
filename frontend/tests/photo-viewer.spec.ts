import { test, expect } from '@playwright/test';
import { PhotoViewerPage } from './pages/PhotoViewerPage';
import {
  DEFAULT_PHOTO,
  DEFAULT_PHOTO_HASH,
  PHOTO_WITH_STORIES,
  PHOTO_WITH_STORIES_HASH,
  url,
} from './helpers';

test('hover to see alternates; click one changes photo ID but preserves hash', async ({ page }) => {
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

test('order prints opens new tab and pre-fills DORIS order form', async ({ page, context }) => {
  await page.goto(
    url(`/map/photo/${DEFAULT_PHOTO}`, {
      noWelcome: true,
      noTipJar: true,
      hash: DEFAULT_PHOTO_HASH,
    })
  );
  const viewer = new PhotoViewerPage(page);
  await viewer.revealOverlay();
  page.on('dialog', (dialog) => dialog.accept());
  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    viewer.clickOrderPrint(),
  ]);
  await newPage.waitForLoadState('networkidle');
  expect(newPage.url()).toContain('dorisorders.nyc.gov');

  await expect(newPage.locator('#image-identifier-key')).toHaveValue(DEFAULT_PHOTO);
  await expect(newPage.locator('#buildingNumber')).toHaveValue('207');
  await expect(newPage.locator('#streetName')).toHaveValue('Varick Street');
  await expect(newPage.locator('#block')).toHaveValue('581');
  await expect(newPage.locator('#lot')).toHaveValue('63');
  await expect(newPage.locator('#select-borough')).toHaveValue('MANHATTAN');
});
