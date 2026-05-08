import { test, expect } from '@playwright/test';
import { url } from './helpers';

const MOCK_PHOTO_ID = 'nynyma_rec0040_1_00581_0063';

const MOCK_STORIES_RESPONSE = {
  items: [
    {
      id: 1,
      createdAt: '2024-01-01T00:00:00Z',
      storyType: 'text',
      storytellerEmail: 'test@example.com',
      storytellerName: 'Tester',
      storytellerSubtitle: '',
      lngLat: { lng: -74.005661, lat: 40.729011 },
      photo: MOCK_PHOTO_ID,
      photoExpanded: {
        identifier: MOCK_PHOTO_ID,
        collection: '1940',
        address: '207 Varick Street',
        borough: 'MANHATTAN',
        block: 581,
        lot: '63',
      },
      state: 'published',
      textContent: 'A test story.',
    },
  ],
  total: 1,
  hasNextPage: false,
};

test('stories list → click story card → back to map with lat/lng hash', async ({ page }) => {
  await page.route('**/stories**', async (route) => {
    // Don't intercept navigation to the /stories page itself, only XHR/fetch API calls
    if (route.request().resourceType() === 'document') {
      return route.continue();
    }
    // Only mock GET requests to avoid interfering with story submission tests
    if (route.request().method() !== 'GET') {
      return route.fallback();
    }
    await route.fulfill({ json: MOCK_STORIES_RESPONSE });
  });

  await page.goto(url('/stories', { noWelcome: true, noTipJar: true }));
  await expect(page.locator('[data-testid="stories-page"]')).toBeVisible();
  await expect(
    page.locator('[data-testid="story-card"]').first()
  ).toBeVisible({ timeout: 10000 });
  await page.locator('[data-testid="story-card"]').first().click();
  await page.waitForURL(/\/stories\/photo\//, { waitUntil: 'commit' });
  await page.locator('[data-testid="back-to-map"]').click();
  await page.waitForURL(/\/map/, { waitUntil: 'commit' });
  expect(new URL(page.url()).hash).toMatch(/^#[\d.]+\//);
});
