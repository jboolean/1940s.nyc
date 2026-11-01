import countBy from 'lodash/countBy';
import MerchCustomizationOptions from '../../entities/MerchCustomizationOptions';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import { getPrintProduct } from './printCatalog';

function describe(
  variant: MerchInternalVariant,
  options?: MerchCustomizationOptions
): string {
  const label = getPrintProduct(variant)?.label ?? variant;
  return options && 'colorize' in options && options.colorize
    ? `${label} (AI colorized)`
    : label;
}

// For example "2 × 8×12 in print (AI colorized)"
export function summarizeItems(
  items: {
    variant: MerchInternalVariant;
    customizationOptions?: MerchCustomizationOptions;
  }[]
): string {
  const counts = countBy(items, (i) =>
    describe(i.variant, i.customizationOptions)
  );
  return Object.entries(counts)
    .map(([description, count]) => `${count} × ${description}`)
    .join(', ');
}
