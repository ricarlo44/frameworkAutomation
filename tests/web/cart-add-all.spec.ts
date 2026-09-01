import { expect, test } from '@playwright/test';

import { config } from '../../src/config/env';
import { LoginPage } from '../../src/pages/LoginPage';
import { ProductsPage } from '../../src/pages/ProductsPage';

// Kept in its own file, not folded into cart.spec.ts: forcing video on
// regardless of pass/fail needs to be top-level in the file (Playwright
// rejects test.use({ video }) inside a nested describe -- it would force a
// new worker mid-file). This is the longest flow in the suite -- it clicks
// all 16 "Agregar al carrito" buttons in sequence -- so a single end-state
// screenshot on failure would not show *where* in that sequence something
// went wrong; the global config only keeps video on failure, this file
// overrides that to always record.
test.use({ video: 'on' });

test('adding every product in the catalog is reflected accurately in the badge and every button', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(config.users.standard, config.password);
  await page.waitForURL('**/products');

  const products = new ProductsPage(page);
  const total = await products.productCount();
  expect(total).toBeGreaterThan(0);

  await products.addAllProducts();

  await expect(products.cartBadge).toHaveText(String(total));
  await expect(products.addToCartButtons.filter({ hasText: 'Quitar del carrito' })).toHaveCount(total);
  await expect(products.addToCartButtons.filter({ hasText: 'Agregar al carrito' })).toHaveCount(0);
});
