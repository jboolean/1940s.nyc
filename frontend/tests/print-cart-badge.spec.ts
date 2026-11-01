import { expect, Page, test } from '@playwright/test';
import { url } from './helpers';

const HASH = '#17.5/40.729011/-74.005661';
const SIZES = {
  desktop: { width: 1280, height: 800 },
  phone: { width: 390, height: 844 },
};

test.use({ deviceScaleFactor: 3 });

function cartOf(count: number): object[] {
  const items = [];
  for (let left = count, i = 0; left > 0; i++) {
    const quantity = Math.min(10, left);
    items.push({
      photoIdentifier: `photo-${i}`,
      variant: 'print-hpr-4x6',
      colorize: false,
      quantity,
    });
    left -= quantity;
  }
  return items;
}

async function openMap(page: Page, count: number): Promise<void> {
  await page.addInitScript((items) => {
    localStorage.setItem(
      'featureFlags',
      JSON.stringify({ state: { 'print-orders': true }, version: 0 })
    );
    localStorage.setItem(
      'print-cart',
      JSON.stringify({ state: { items, savedAt: Date.now() }, version: 0 })
    );
  }, cartOf(count));
  await page.goto(url('/map', { noWelcome: true, noTipJar: true, hash: HASH }));
  await page.locator('[data-testid="print-cart-button"]').waitFor();
}

// Where the white digit is actually drawn inside the badge, in CSS pixels from the badge's
// top-left, found by scanning a zoomed screenshot of the badge for non-green pixels.
async function inkBox(
  page: Page,
  png: Buffer
): Promise<{ left: number; right: number; top: number; bottom: number }> {
  return page.evaluate(async (base64) => {
    const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.drawImage(bitmap, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const scale = window.devicePixelRatio;
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        // The digit is white and the badge is green, so a high blue channel marks digit pixels.
        if (data[i + 2] > 180 && data[i] > 180) {
          left = Math.min(left, x);
          right = Math.max(right, x + 1);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y + 1);
        }
      }
    }
    return {
      left: left / scale,
      right: right / scale,
      top: top / scale,
      bottom: bottom / scale,
    };
  }, png.toString('base64'));
}

for (const [name, size] of Object.entries(SIZES)) {
  for (const count of [1, 2, 9, 12, 20]) {
    test(`cart badge is centered in the button and the digit in the badge (${name}, ${count})`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await openMap(page, count);
      const button = page.locator('[data-testid="print-cart-button"]');
      const badge = page.locator('[data-testid="print-cart-count"]');
      await expect(badge).toHaveText(String(count));

      const boxes = await page.evaluate(() => {
        const buttonEl = document.querySelector(
          '[data-testid="print-cart-button"]'
        ) as HTMLElement;
        const badgeEl = document.querySelector(
          '[data-testid="print-cart-count"]'
        ) as HTMLElement;
        const range = document.createRange();
        range.selectNodeContents(badgeEl);
        return {
          button: buttonEl.getBoundingClientRect().toJSON() as DOMRect,
          badge: badgeEl.getBoundingClientRect().toJSON() as DOMRect,
          text: range.getBoundingClientRect().toJSON() as DOMRect,
        };
      });

      const topGap = boxes.badge.top - boxes.button.top;
      const bottomGap = boxes.button.bottom - boxes.badge.bottom;
      expect(Math.abs(topGap - bottomGap)).toBeLessThanOrEqual(1);

      const textCenterX = boxes.text.left + boxes.text.width / 2;
      const textCenterY = boxes.text.top + boxes.text.height / 2;
      const badgeCenterX = boxes.badge.left + boxes.badge.width / 2;
      const badgeCenterY = boxes.badge.top + boxes.badge.height / 2;
      expect(Math.abs(textCenterX - badgeCenterX)).toBeLessThanOrEqual(1);
      expect(Math.abs(textCenterY - badgeCenterY)).toBeLessThanOrEqual(1);

      const ink = await inkBox(page, await badge.screenshot());
      const inkOffsetX = (ink.left + ink.right) / 2 - boxes.badge.width / 2;
      const inkOffsetY = (ink.top + ink.bottom) / 2 - boxes.badge.height / 2;
      expect(Math.abs(inkOffsetX)).toBeLessThanOrEqual(1);
      expect(Math.abs(inkOffsetY)).toBeLessThanOrEqual(1);

      console.log(
        `${name} ${count}: gaps ${topGap.toFixed(2)}/${bottomGap.toFixed(
          2
        )}, ` +
          `text-vs-badge center ${(textCenterX - badgeCenterX).toFixed(2)},${(
            textCenterY - badgeCenterY
          ).toFixed(2)}, ` +
          `ink-vs-badge center ${inkOffsetX.toFixed(2)},${inkOffsetY.toFixed(
            2
          )}`
      );
      await button.hover();
    });
  }
}
