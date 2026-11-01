import type { Sizing } from 'prodigi-print-api';
import type { PrintVariant } from '../../entities/MerchCustomizationOptions';
import MerchInternalVariant from '../../enum/MerchInternalVariant';

export interface PrintProduct {
  variant: MerchInternalVariant;
  sku: string;
  attributes: Record<string, string>;
  sizing: Sizing;
  label: string;
}

// Photos are 2:3 and so are all these print areas, so fitPrintArea keeps the whole photo with no margin.
const sizing: Sizing = 'fitPrintArea';

export const PRINT_PRODUCTS: PrintProduct[] = [
  {
    variant: MerchInternalVariant.PRINT_HPR_4X6,
    sku: 'GLOBAL-HPR-4X6',
    attributes: {},
    sizing,
    label: '4×6 print',
  },
  {
    variant: MerchInternalVariant.PRINT_HPR_8X12,
    sku: 'GLOBAL-HPR-8X12',
    attributes: {},
    sizing,
    label: '8×12 print',
  },
  {
    variant: MerchInternalVariant.PRINT_FAP_8X12_FRAMED,
    sku: 'GLOBAL-BOX-8X12',
    attributes: { color: 'black' },
    sizing,
    label: '8×12 framed print',
  },
];

export function getPrintProduct(
  variant: MerchInternalVariant
): PrintProduct | undefined {
  return PRINT_PRODUCTS.find((p) => p.variant === variant);
}

export function isPrintVariant(
  variant: MerchInternalVariant
): variant is PrintVariant {
  return !!getPrintProduct(variant);
}
