import { expect, test } from '@playwright/test';

import { config } from '../../src/config/env';
import { LoginPage } from '../../src/pages/LoginPage';
import { ProductsPage } from '../../src/pages/ProductsPage';

test.describe('mobile: login', () => {
  test('standard_user logs in with a tap on a Galaxy S25 viewport', async ({ page }) => {
    const login = new LoginPage(page);
    const products = new ProductsPage(page);

    await login.goto();
    await login.usernameInput.tap();
    await login.usernameInput.fill(config.users.standard);
    await login.passwordInput.tap();
    await login.passwordInput.fill(config.password);
    await login.loginButton.tap();

    await products.waitUntilLoaded();
    await expect(products.title).toHaveText('Productos');
  });

  test('the hamburger menu opens on mobile, and Logout returns to the login screen', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(config.users.standard, config.password);
    await page.waitForURL('**/products');

    await page.getByTestId('react-burger-menu-btn').tap();
    await expect(page.getByRole('link', { name: 'All Items' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'About' })).toBeVisible();

    await page.getByRole('button', { name: 'Logout' }).tap();

    await expect(page).toHaveURL(config.storeUrl + '/');
    await expect(page.getByTestId('login-button')).toBeVisible();
  });
});
