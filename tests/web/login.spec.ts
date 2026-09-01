import { expect, test } from '@playwright/test';

import { config } from '../../src/config/env';
import { LoginPage } from '../../src/pages/LoginPage';
import { ProductsPage } from '../../src/pages/ProductsPage';

test.describe('login', () => {
  test('standard_user logs in and reaches the product catalog', async ({ page }) => {
    const login = new LoginPage(page);
    const products = new ProductsPage(page);

    await login.goto();
    await login.login(config.users.standard, config.password);
    await products.waitUntilLoaded();

    await expect(products.title).toHaveText('Productos');
    await expect(products.inventoryContainer).toBeVisible();
  });

  test('timeout_user logs in successfully like any other valid account', async ({ page }) => {
    // In the original SauceDemo, "timeout_user" simulates extra network
    // latency. On this clone it logs in with no observable delay (measured
    // during exploration at ~50ms, the same as standard_user) -- so this
    // test only confirms the account itself isn't blocked or rejected,
    // it does not assert on timing (that would be asserting a behavior
    // that doesn't actually exist here and would only add flakiness).
    const login = new LoginPage(page);
    const products = new ProductsPage(page);

    await login.goto();
    await login.login(config.users.timeout, config.password);
    await products.waitUntilLoaded();

    await expect(products.title).toHaveText('Productos');
  });

  test('blocked_user is denied access with a clear, specific error message', async ({ page }) => {
    const login = new LoginPage(page);

    await login.goto();
    await login.login(config.users.blocked, config.password);

    await expect(login.errorMessage).toHaveText('Este usuario ha sido bloqueado');
    await expect(page).toHaveURL(config.storeUrl + '/');
  });

  test('a known username with the wrong password is rejected with a generic error', async ({ page }) => {
    // The message does not reveal whether the username or the password was
    // wrong -- a deliberate (and correct) security choice worth locking in
    // with an explicit assertion, not just "some error shows up".
    const login = new LoginPage(page);

    await login.goto();
    await login.login(config.users.standard, 'wrong_password');

    await expect(login.errorMessage).toHaveText('Usuario y/o clave incorrectas');
  });

  test('a username that does not exist at all is rejected with its own message', async ({ page }) => {
    // Worth keeping as its own test rather than folding into the wrong-password
    // case above: this path returns a different, English-language message
    // ("Invalid username.") instead of the Spanish generic one used
    // elsewhere in the app -- a small copy/locale inconsistency, not a
    // functional bug, but real behavior this suite should pin down.
    const login = new LoginPage(page);

    await login.goto();
    await login.login('a_user_that_does_not_exist', config.password);

    await expect(login.errorMessage).toHaveText('Invalid username.');
  });

  test('the login button stays disabled until both username and password are filled in', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await expect(login.loginButton).toBeDisabled();

    await login.usernameInput.fill(config.users.standard);
    await expect(login.loginButton).toBeDisabled();

    await login.usernameInput.fill('');
    await login.passwordInput.fill(config.password);
    await expect(login.loginButton).toBeDisabled();

    await login.usernameInput.fill(config.users.standard);
    await expect(login.loginButton).toBeEnabled();
  });
});
