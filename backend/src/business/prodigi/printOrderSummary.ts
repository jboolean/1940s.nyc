import countBy from 'lodash/countBy';
import MerchCustomizationOptions from '../../entities/MerchCustomizationOptions';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import { getPrintProduct, isPrintVariant } from './printCatalog';

function describe(
  variant: MerchInternalVariant,
  customizationOptions?: MerchCustomizationOptions
): string {
  if (!isPrintVariant(variant)) {
    return variant;
  }
  const { label } = getPrintProduct(variant);
  const colorized =
    customizationOptions && 'colorize' in customizationOptions
      ? customizationOptions.colorize
      : false;
  return colorized ? `${label} (AI colorized)` : label;
}

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
