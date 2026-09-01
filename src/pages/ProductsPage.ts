import type { Locator, Page } from '@playwright/test';

export class ProductsPage {
  readonly page: Page;
  readonly title: Locator;
  readonly inventoryContainer: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly addToCartButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByTestId('title');
    this.inventoryContainer = page.getByTestId('inventory-container');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('cart-count-badge');
    this.addToCartButtons = page.getByTestId('inventory-item-button');
  }

  async waitUntilLoaded(): Promise<void> {
    await this.page.waitForURL('**/products');
  }

  async productCount(): Promise<number> {
    return this.addToCartButtons.count();
  }

  async addProductByIndex(index: number): Promise<void> {
    await this.addToCartButtons.nth(index).click();
  }

  async addAllProducts(): Promise<void> {
    const count = await this.productCount();
    for (let i = 0; i < count; i++) {
      await this.addToCartButtons.nth(i).click();
    }
  }

  async goToCart(): Promise<void> {
    await this.cartLink.click();
  }
}
