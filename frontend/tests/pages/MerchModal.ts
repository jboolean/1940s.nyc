import { Locator, Page } from '@playwright/test';

export class MerchModal {
  constructor(private page: Page) {}

  modal(): Locator {
    return this.page.locator('[data-testid="merch-modal"]');
  }

  async checkout(): Promise<void> {
    await this.page
      .locator('[data-testid="merch-checkout-button"]')
      .click();
  }
}
