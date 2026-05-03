import { defineConfig, devices } from '@playwright/test';

const isCI = process.env.CI === 'true';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: process.env.BASE_URL || 'http://dev.1940s.nyc:8080',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // In CI we test against the Netlify preview deploy — no local server needed
  ...(isCI
    ? {}
    : {
        webServer: {
          command: 'npm run watch',
          url: 'http://dev.1940s.nyc:8080',
          reuseExistingServer: true,
          timeout: 60_000,
        },
      }),
});
