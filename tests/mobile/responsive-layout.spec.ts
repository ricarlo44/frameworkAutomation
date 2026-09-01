import { expect, test } from '@playwright/test';

import { config } from '../../src/config/env';
import { LoginPage } from '../../src/pages/LoginPage';
import { ProductsPage } from '../../src/pages/ProductsPage';

// REPORTED DEFECT (see DEFECT_REPORT.md "Mobile: horizontal overflow on the
// product catalog"): left failing on purpose, the way the accessibility
// contrast defect was handled in the previous assessment -- this is the
// headline finding of the mobile phase, and "a reproducible defect with an
// automated failing test" is meant to be visible just by running the
// suite, not opted into with test.fail().
test.describe('mobile: responsive layout', () => {
  test('the product catalog does not overflow horizontally on a Galaxy S25 viewport', async ({ page }) => {
    const login = new LoginPage(page);
    const products = new ProductsPage(page);

    await login.goto();
    await login.login(config.users.standard, config.password);
    await products.waitUntilLoaded();

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    // Actual behavior today: scrollWidth (468px) > clientWidth (360px) --
    // the two-column product grid does not collapse to one column at this
    // breakpoint, so product names, descriptions, and the "Agregar al
    // carrito" button label are clipped off the left edge of the screen
    // (see DEFECT_REPORT.md for the screenshot).
    expect(overflow.scrollWidth, 'page should not scroll horizontally on a 360px-wide phone').toBeLessThanOrEqual(
      overflow.clientWidth,
    );
  });
});
