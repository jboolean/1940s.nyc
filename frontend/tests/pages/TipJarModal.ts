import { Locator, Page } from '@playwright/test';

export class TipJarModal {
  constructor(private page: Page) {}

  modal(): Locator {
    return this.page.locator('[data-testid="tip-jar-modal"]');
  }

  async selectFrequency(freq: 'monthly' | 'one-time'): Promise<void> {
    const label = freq === 'monthly' ? 'Monthly support' : 'One-time tip';
    await this.modal().getByRole('button', { name: label }).click();
  }

  async selectPreset(index: number): Promise<void> {
    await this.modal().locator('[data-testid="tip-jar-preset-button"]').nth(index).click();
  }

  async fillAmount(dollars: number): Promise<void> {
    const input = this.modal().locator('input[placeholder="$0"]');
    await input.fill(String(dollars));
  }

  async submit(): Promise<void> {
    await this.page.locator('[data-testid="tip-submit-button"]').click();
  }
}
