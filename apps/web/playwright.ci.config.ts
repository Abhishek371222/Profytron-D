import { defineConfig, devices } from '@playwright/test';

/**
 * CI-only Playwright config: chromium smoke against a production Next server.
 * Full multi-browser suite remains in playwright.config.ts for local/manual.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: /ci-smoke\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: true,
  retries: 1,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm start',
    cwd: __dirname,
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      PORT: '3000',
      NEXT_PUBLIC_ENABLE_MOCK_API: 'true',
    },
  },
});
