import { expect, Locator, Page } from '@playwright/test';

export class PhotoViewerPage {
  constructor(private page: Page) {}

  pane(): Locator {
    return this.page.locator('[data-testid="viewer-pane"]');
  }

  stories(): Locator {
    return this.page.locator('[data-testid="stories-on-photo"]');
  }

  async revealOverlay(): Promise<void> {
    await this.pane().hover();
    await expect(this.page.locator('[data-testid="alternates"]')).toBeVisible();
  }

  async clickFirstAlternate(): Promise<void> {
    const links = this.page.locator('[data-testid="alternate-photo"]');
    await links.nth(1).waitFor({ state: 'visible', timeout: 10000 });
    await links.nth(1).click({ force: true });
  }

  async clickKnowThisPlace(): Promise<void> {
    await this.page.locator('[data-testid="know-this-place-button"]').click();
  }

  async clickOrderPrint(): Promise<void> {
    await this.page.locator('[data-testid="order-print-button"]').click();
  }

  async clickColorize(): Promise<void> {
    await this.page.locator('[data-testid="colorize-button"]').click();
  }
}
