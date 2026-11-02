import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const CI = Boolean(process.env.CI);
// Cloud sessions pre-install a Chromium that can be newer than the one Playwright 1.56.1
// expects; use it directly when it's there. CI uses the Playwright container's own browser.
const CLOUD_CHROMIUM = '/opt/pw-browsers/chromium';
const launchOptions = !CI && existsSync(CLOUD_CHROMIUM) ? { executablePath: CLOUD_CHROMIUM } : {};
const PORT = 4173;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  // A failing browser test is a bug to fix, not something to retry away.
  retries: 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, launchOptions },
    },
  ],
  // Tests run against the production build, served the way a static host would.
  webServer: {
    command: `npx vite build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
});
