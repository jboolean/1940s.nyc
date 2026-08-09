/// <reference lib="dom" />

import puppeteer from 'puppeteer-core';
import type SparticuzChromium from '@sparticuz/chromium';

const IS_LOCAL = !!process.env.IS_LOCAL;
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL as string;

// Install using `npx @puppeteer/browsers install chromium` locally
const LOCAL_CHROMIUM_EXECUTABLE_PATH =
  './chromium/mac_arm-1447349/chrome-mac/Chromium.app/Contents/MacOS/Chromium';

// Move center to account for tote bag bottom
const LAT_OFFSET = -0.0007;
const ZOOM = 17;

// @sparticuz/chromium ships as an ES module. TypeScript's CommonJS output
// rewrites `await import(...)` into a synchronous require(), which Node
// refuses for a not-yet-loaded ES module. Calling import() indirectly (via
// `new Function`) hides it from that rewrite, so this is Node's real,
// asynchronous import() rather than a disguised require().
// eslint-disable-next-line @typescript-eslint/no-implied-eval -- not eval; forces a genuine dynamic import(), see comment above
const importChromium = new Function(
  'return import("@sparticuz/chromium")'
) as () => Promise<{
  default: typeof SparticuzChromium;
}>;

export default async function renderToteBag({
  lat,
  lng,
  style,
  foregroundColor,
  backgroundColor,
}: {
  lat: number;
  lng: number;
  style?: string;
  foregroundColor?: string;
  backgroundColor?: string;
}): Promise<Buffer> {
  const chromium = IS_LOCAL ? null : (await importChromium()).default;

  const browser = await puppeteer.launch({
    args:
      IS_LOCAL || !chromium
        ? puppeteer.defaultArgs()
        : puppeteer.defaultArgs({
            args: chromium.args,
            headless: 'shell',
          }),
    defaultViewport: { width: 17 * 150, height: 33 * 150 },
    executablePath:
      IS_LOCAL || !chromium
        ? LOCAL_CHROMIUM_EXECUTABLE_PATH
        : await chromium.executablePath(),
    headless: 'shell',
    acceptInsecureCerts: IS_LOCAL,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 17 * 150, height: 33 * 150 });
  // Surface errors from inside the rendered page - otherwise a JS error in
  // the frontend fails silently until the waitForSelector timeout below,
  // with no indication of the real cause.
  page.on('console', (msg) =>
    console.log(`[render-tote-bag page console] ${msg.text()}`)
  );
  page.on('pageerror', (err) =>
    console.error('[render-tote-bag page error]', err)
  );

  const urlParams = new URLSearchParams();
  urlParams.append('noWelcome', 'true');
  urlParams.append('noTipJar', 'true');
  if (style) {
    urlParams.append('style', style);
  }
  if (foregroundColor) {
    urlParams.append('foregroundColor', foregroundColor);
  }
  if (backgroundColor) {
    urlParams.append('backgroundColor', backgroundColor);
  }

  const hash = `${ZOOM}/${(lat + LAT_OFFSET).toFixed(6)}/${lng.toFixed(6)}`;

  const url = new URL('/render-merch/tote-bag', FRONTEND_BASE_URL);
  url.search = urlParams.toString();
  url.hash = hash;

  await page.goto(url.toString(), {
    waitUntil: 'networkidle2',
  });

  await page.waitForSelector('#render-content');

  // sleep 5 seconds for all map tiles to load
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const element = await page.$('#render-content');
  if (!element) {
    console.error('Element with class .tote-bag-content not found');
    await browser.close();
    process.exit(1);
  }

  const screenshotBuffer = await element.screenshot();

  await browser.close();

  return Buffer.from(screenshotBuffer);
}
