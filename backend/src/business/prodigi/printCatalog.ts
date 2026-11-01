import type { Sizing } from 'prodigi-print-api';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import { PrintVariant } from '../merch/merchCatalog';

export interface PrintProduct {
  variant: PrintVariant;
  sku: string;
  attributes: Record<string, string>;
  sizing: Sizing;
}

// Photos are 2:3 and so are all these print areas, so fitPrintArea keeps the whole photo with no margin.
const sizing: Sizing = 'fitPrintArea';

export const PRINT_PRODUCTS: PrintProduct[] = [
  {
    variant: MerchInternalVariant.PRINT_HPR_4X6,
    sku: 'GLOBAL-HPR-4X6',
    attributes: {},
    sizing,
  },
  {
    variant: MerchInternalVariant.PRINT_HPR_8X12,
    sku: 'GLOBAL-HPR-8X12',
    attributes: {},
    sizing,
  },
  {
    variant: MerchInternalVariant.PRINT_FAP_8X12_FRAMED,
    sku: 'GLOBAL-BOX-8X12',
    attributes: { color: 'black' },
    sizing,
  },
];

export function getPrintProduct(
  variant: MerchInternalVariant
): PrintProduct | undefined {
  return PRINT_PRODUCTS.find((p) => p.variant === variant);
}

export function isPrintVariant(variant: MerchInternalVariant): boolean {
  return PRINT_PRODUCTS.some((p) => p.variant === variant);
}
