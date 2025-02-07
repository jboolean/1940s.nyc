/// <reference lib="dom" />

import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

const IS_LOCAL = !!process.env.IS_LOCAL;
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL as string;

// Install using `npx @puppeteer/browsers install chromium` locally
const LOCAL_CHROMIUM_EXECUTABLE_PATH =
  './chromium/mac_arm-1416712/chrome-mac/Chromium.app/Contents/MacOS/Chromium';

// Move center to account for tote bag bottom
const LAT_OFFSET = -0.0007;
const ZOOM = 17;

export default async function renderToteBag({
  lat,
  lon,
}: {
  lat: number;
  lon: number;
}): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: IS_LOCAL ? puppeteer.defaultArgs() : chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: IS_LOCAL
      ? LOCAL_CHROMIUM_EXECUTABLE_PATH
      : await chromium.executablePath(),
    headless: chromium.headless as 'shell' | boolean,
    acceptInsecureCerts: IS_LOCAL,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 17 * 150, height: 33 * 150 });

  await page.goto(
    `${FRONTEND_BASE_URL}/render-merch/tote-bag?noWelcome&noTipJar#${ZOOM}/${(
      lat + LAT_OFFSET
    ).toFixed(6)}/${lon.toFixed(6)}`,
    {
      waitUntil: 'networkidle2',
    }
  );

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
