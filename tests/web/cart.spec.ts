import { expect, test } from '@playwright/test';

import { config } from '../../src/config/env';
import { LoginPage } from '../../src/pages/LoginPage';
import { ProductsPage } from '../../src/pages/ProductsPage';

test.describe('cart', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    const products = new ProductsPage(page);
    await login.goto();
    await login.login(config.users.standard, config.password);
    await products.waitUntilLoaded();
  });

  test('the cart badge does not exist until something is added', async ({ page }) => {
    const products = new ProductsPage(page);
    await expect(products.cartBadge).toHaveCount(0);
  });

  test('adding a single product shows a badge of 1 and flips only that product\'s button', async ({ page }) => {
    const products = new ProductsPage(page);

    await products.addProductByIndex(0);

    await expect(products.cartBadge).toHaveText('1');
    await expect(products.addToCartButtons.first()).toHaveText('Quitar del carrito');

    const total = await products.productCount();
    const untouched = products.addToCartButtons.filter({ hasText: 'Agregar al carrito' });
    await expect(untouched).toHaveCount(total - 1);
  });

  test('adding several products accumulates in the badge, one per click', async ({ page }) => {
    const products = new ProductsPage(page);
    const howMany = 4;

    for (let i = 0; i < howMany; i++) {
      await products.addProductByIndex(i);
      await expect(products.cartBadge).toHaveText(String(i + 1));
    }

    const addedButtons = products.addToCartButtons.filter({ hasText: 'Quitar del carrito' });
    await expect(addedButtons).toHaveCount(howMany);
  });

  test('removing a product decrements the badge and restores its own button label', async ({ page }) => {
    const products = new ProductsPage(page);

    await products.addProductByIndex(0);
    await products.addProductByIndex(1);
    await expect(products.cartBadge).toHaveText('2');

    await products.addProductByIndex(0); // second click on the same button removes it

    await expect(products.cartBadge).toHaveText('1');
    await expect(products.addToCartButtons.first()).toHaveText('Agregar al carrito');
    await expect(products.addToCartButtons.nth(1)).toHaveText('Quitar del carrito');
  });

  test('the cart icon leads straight to checkout, and cancelling from there preserves the cart', async ({ page }) => {
    // This store has no separate "review cart" screen (confirmed during
    // exploration): the cart icon routes directly to the checkout info
    // step ("Sus Datos"). What this test locks in is that the cart's
    // contents survive a round trip through that screen via "Cancelar".
    const products = new ProductsPage(page);
    await products.addProductByIndex(0);

    await products.goToCart();
    await page.waitForURL('**/your-data');

    await page.getByRole('button', { name: /cancelar/i }).click();
    await page.waitForURL('**/products');

    await expect(products.cartBadge).toHaveText('1');
    await expect(products.addToCartButtons.first()).toHaveText('Quitar del carrito');
  });
});
