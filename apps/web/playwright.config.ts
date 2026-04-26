import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 20_000,
  },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    headless: true,
    trace: 'off',
    screenshot: 'only-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/dev-smoke.ps1',
    url: 'http://127.0.0.1:3000/login',
    reuseExistingServer: true,
    timeout: 240_000,
  },
  projects: [
    {
      name: 'chrome',
      use: {
        browserName: 'chromium',
        channel: 'chrome',
      },
    },
  ],
  outputDir: 'test-results',
});
