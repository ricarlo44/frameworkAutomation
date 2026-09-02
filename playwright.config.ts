import { defineConfig, devices } from '@playwright/test';

import { config } from './src/config/env';
import { galaxyS25 } from './src/config/devices';

/**
 * Three isolated projects sharing one report:
 *  - "web"    desktop Chromium against the store's real UI (login, cart).
 *  - "mobile" the same store, emulated on a Galaxy S25 viewport/UA -- the
 *             store is a responsive website, not a native app, so device
 *             emulation is the right layer (see README "Mobile strategy").
 *  - "api"    no browser, HTTP-only, against dummyjson.com (the store itself
 *             ships no backend API -- see README "Why dummyjson.com").
 * Video is only kept for failed tests project-wide; the cart's "all
 * products" flow and the mobile "full purchase" flow additionally force
 * video on regardless of outcome (see tests/web/cart-add-all.spec.ts and
 * tests/mobile/shopping-flow.spec.ts) because those flows are long enough
 * that a single screenshot on failure would not be enough to diagnose them.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['html', { open: 'never' }],
  ],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // The store's own markup uses data-test="..." (SauceDemo convention),
    // not Playwright's default data-testid -- this lets getByTestId() match it.
    testIdAttribute: 'data-test',
  },
  projects: [
    {
      name: 'web',
      testDir: './tests/web',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: config.storeUrl,
      },
    },
    {
      name: 'mobile',
      testDir: './tests/mobile',
      use: {
        ...galaxyS25,
        baseURL: config.storeUrl,
      },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: config.apiBaseUrl,
      },
    },
  ],
});
