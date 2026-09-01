import { devices } from '@playwright/test';

type Device = (typeof devices)[string];

/**
 * Playwright's bundled device list (as of the installed version) tops out at
 * "Galaxy S24" -- the Galaxy S25 is newer than that data set. This profile
 * is built by hand using the real Galaxy S25's public specs (model
 * SM-S931U, Android 15 / One UI 7 at launch, 6.2" 1080x2340 display at a
 * ~3x device pixel ratio -- the same physical viewport class as the S24),
 * so the emulation is accurate even though it isn't one of Playwright's
 * built-in named devices.
 */
export const galaxyS25: Device = {
  userAgent:
    'Mozilla/5.0 (Linux; Android 15; SM-S931U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  viewport: { width: 360, height: 780 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  defaultBrowserType: 'chromium',
};
