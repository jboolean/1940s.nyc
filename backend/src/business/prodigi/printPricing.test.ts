import { getAllPrintProducts } from './printCatalog';
import {
  PRINT_COST_CENTS,
  PRINT_PRICE_CENTS,
  printMarginCents,
} from './printPricing';

describe('print pricing', () => {
  it('prices every catalog variant and knows its cost', () => {
    for (const { variant } of getAllPrintProducts()) {
      expect(PRINT_PRICE_CENTS[variant]).toBeGreaterThan(0);
      expect(PRINT_COST_CENTS[variant]).toBeDefined();
    }
  });

  it('anchors the 8x12 print just under $20', () => {
    expect(PRINT_PRICE_CENTS['print-hpr-8x12']).toBe(1900);
  });

  it('keeps at least a 30% margin after Prodigi cost and Stripe fees', () => {
    for (const { variant } of getAllPrintProducts()) {
      const margin = printMarginCents(variant);
      expect([variant, margin / PRINT_PRICE_CENTS[variant] >= 0.3]).toEqual([
        variant,
        true,
      ]);
    }
  });
});
