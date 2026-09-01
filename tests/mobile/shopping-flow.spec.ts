import { expect, test } from '@playwright/test';

import { config } from '../../src/config/env';
import { LoginPage } from '../../src/pages/LoginPage';
import { ProductsPage } from '../../src/pages/ProductsPage';

// Recorded regardless of pass/fail: this is the longest mobile flow in the
// suite (login -> add two products by tap -> checkout form -> order
// confirmation), spanning four screens, so a single end-state screenshot
// would not show where in the journey something broke.
test.use({ video: 'on' });

test('a full purchase, start to finish, works end to end on a Galaxy S25 viewport', async ({ page }) => {
  const login = new LoginPage(page);
  const products = new ProductsPage(page);

  await login.goto();
  await login.login(config.users.standard, config.password);
  await products.waitUntilLoaded();

  await products.addProductByIndex(0);
  await products.addProductByIndex(1);
  await expect(products.cartBadge).toHaveText('2');

  await products.goToCart();
  await page.waitForURL('**/your-data');

  const fields = page.locator('input');
  await fields.nth(0).tap();
  await fields.nth(0).fill('Ricardo');
  await fields.nth(1).tap();
  await fields.nth(1).fill('Lopez');
  await fields.nth(2).tap();
  await fields.nth(2).fill('qa.mobile@example.com');

  await page.getByRole('button', { name: /continuar/i }).tap();

  await page.waitForURL('**/checkout');
  await expect(page.getByText('Compra Completada')).toBeVisible();
});
