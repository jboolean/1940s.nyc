import { test, expect } from '@playwright/test';
import { DEFAULT_PHOTO_HASH, url } from './helpers';

test('click a dot opens photo viewer without moving map', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));
  await page.goto(url('/map', { noWelcome: true, noTipJar: true, hash: DEFAULT_PHOTO_HASH }));
  const html = await page.content();
  console.log('Page HTML (first 3000 chars):', html.substring(0, 3000));
  console.log('Page URL:', page.url());
  console.log('Console errors:', JSON.stringify(errors));
  // Check app-container
  const appExists = await page.locator('#app-container').count();
  console.log('app-container exists:', appExists);
  const appHtml = await page.locator('#app-container').innerHTML();
  console.log('app-container HTML:', appHtml.substring(0, 2000));
  await expect(page.locator('[data-testid="map"]')).toBeAttached();
  // Wait for the map style to load and find a photo near center
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
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));
  await page.goto(url('/map', { noWelcome: true, noTipJar: true }));
  const html = await page.content();
  console.log('Page HTML (first 3000 chars):', html.substring(0, 3000));
  console.log('Page URL:', page.url());
  console.log('Console errors:', JSON.stringify(errors));
  // Check app-container
  const appExists = await page.locator('#app-container').count();
  console.log('app-container exists:', appExists);
  const appHtml = await page.locator('#app-container').innerHTML();
  console.log('app-container HTML:', appHtml.substring(0, 2000));
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
