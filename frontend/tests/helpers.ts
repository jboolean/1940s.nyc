import { expect, Page } from '@playwright/test';

export const PHOTO_WITH_STORIES = 'nynyma_rec0040_4_01224_0026';
export const PHOTO_WITH_STORIES_HASH = '#16/40.7487158/-73.9094046';
export const DEFAULT_PHOTO = 'nynyma_rec0040_1_00581_0063';
export const DEFAULT_PHOTO_HASH = '#17.5/40.729011/-74.005661';

export function url(
  path: string,
  opts: {
    noWelcome?: boolean;
    noTipJar?: boolean;
    hash?: string;
    extra?: string;
  } = {}
): string {
  const params: string[] = [];
  if (opts.noWelcome) params.push('noWelcome');
  if (opts.noTipJar) params.push('noTipJar');
  if (opts.extra) {
    const extra = opts.extra.startsWith('&') ? opts.extra.slice(1) : opts.extra;
    params.push(extra);
  }
  const search = params.length ? `?${params.join('&')}` : '';
  const hash = opts.hash ?? '';
  return `${path}${search}${hash}`;
}

export async function expectStripeRedirect(page: Page): Promise<void> {
  await page.waitForURL(/stripe\.com/, { timeout: 15_000 });
  expect(page.url()).toContain('stripe.com');
}
