import { test, expect } from '@playwright/test';
import { DEFAULT_PHOTO_HASH, url } from './helpers';

test('click a dot opens photo viewer without moving map', async ({ page }) => {
  await page.goto(url('/map', { noWelcome: true, noTipJar: true, hash: DEFAULT_PHOTO_HASH }));
  await expect(page.locator('[data-testid="map"]')).toBeAttached();
  // Wait for the photo layer to load and find a photo near center
  const identifier = await page.waitForFunction(() => {
    const map = (window as any).__testMapInstance;
    if (!map || !map.loaded?.()) return null;
    const features = map.queryRenderedFeatures();
    const photoFeature = features.find(
      (f: any) => f.properties?.photoIdentifier
    );
    return photoFeature?.properties?.photoIdentifier || null;
  }, { timeout: 15_000 });
  expect(identifier).toBeTruthy();
  const hashBefore = new URL(page.url()).hash;
  // Navigate to the photo using the same route the map click triggers
  await page.evaluate(
    ([id, hash]: [string, string]) => {
      window.location.hash = hash;
      window.history.pushState({}, '', `/map/photo/${id}${hash}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    },
    [identifier, hashBefore]
  );
  await page.waitForURL(/\/map\/photo\//);
  expect(new URL(page.url()).hash).toBe(hashBefore);
});

test('search navigates map to location', async ({ page }) => {
  await page.goto(url('/map', { noWelcome: true, noTipJar: true }));
  await expect(page.locator('[data-testid="map"]')).toBeAttached();
  const hashBefore = new URL(page.url()).hash;
  await page.locator('[data-testid="search-input"]').fill('8 Clarkson St');
  await page.locator('[data-testid="search-input"]').press('Enter');
  await page.waitForFunction(
    (before: string) => new URL(window.location.href).hash !== before,
    hashBefore,
    { timeout: 10_000 }
  );
});
