import MerchInternalVariant from '../../enum/MerchInternalVariant';
import { summarizeItems } from './printOrderSummary';

describe('summarizeItems', () => {
  it('groups identical items and notes colorization', () => {
    const colorized = {
      variant: MerchInternalVariant.PRINT_HPR_8X12 as const,
      photoIdentifier: 'p1',
      colorize: true,
    };
    expect(
      summarizeItems([
        { variant: colorized.variant, customizationOptions: colorized },
        { variant: colorized.variant, customizationOptions: colorized },
        {
          variant: MerchInternalVariant.PRINT_HPR_4X6,
          customizationOptions: {
            ...colorized,
            variant: MerchInternalVariant.PRINT_HPR_4X6,
            colorize: false,
          },
        },
      ])
    ).toBe('2 × 8×12 in print (AI colorized), 1 × 4×6 in print');
  });
});
