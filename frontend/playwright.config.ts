import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://dev.1940s.nyc:8080',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run watch',
    url: 'http://dev.1940s.nyc:8080',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
