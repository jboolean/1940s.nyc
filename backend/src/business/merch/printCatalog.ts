import type { Sizing } from 'prodigi-print-api';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import MerchProvider from '../../enum/MerchProvider';
import type { ProdigiProduct } from '../prodigi/ProdigiProduct';
import type { WhccProduct } from '../whcc/WhccProduct';
import type { PrintVariant } from './merchCatalog';

// What each provider needs to print a variant, so any provider can fulfil any print.
export interface PrintProduct {
  variant: PrintVariant;
  [MerchProvider.PRODIGI]: ProdigiProduct;
  [MerchProvider.WHCC]: WhccProduct;
}

const photoPrint = (size: string): WhccProduct => ({
  productRef: 'photo-print',
  selections: {
    size,
    printing_material: 'paper',
    surface: 'lustre',
    dynamic_borders: 'no',
    dynamic_layout: 'no',
    mounting: 'no',
    finishing: 'no',
    texture: 'no',
  },
});

// Photos are 2:3 and so are all these print areas, so fitPrintArea keeps the whole photo with no margin.
const sizing: Sizing = 'fitPrintArea';

export const PRINT_PRODUCTS: PrintProduct[] = [
  {
    variant: MerchInternalVariant.PRINT_HPR_4X6,
    [MerchProvider.PRODIGI]: { sku: 'GLOBAL-HPR-4X6', attributes: {}, sizing },
    [MerchProvider.WHCC]: photoPrint('4x6'),
  },
  {
    variant: MerchInternalVariant.PRINT_HPR_8X12,
    [MerchProvider.PRODIGI]: { sku: 'GLOBAL-HPR-8X12', attributes: {}, sizing },
    [MerchProvider.WHCC]: photoPrint('8x12'),
  },
  {
    variant: MerchInternalVariant.PRINT_FAP_8X12_FRAMED,
    [MerchProvider.PRODIGI]: {
      sku: 'GLOBAL-BOX-8X12',
      attributes: { color: 'black' },
      sizing,
    },
    [MerchProvider.WHCC]: {
      productRef: 'framed-print',
      selections: {
        size: '8x12',
        moulding: 'gallery_fine_black',
        surface: 'photo_print',
        photo_print: 'lustre_photo_print',
        lamination: 'no',
        mat: 'no',
        acrylic: 'no',
        dynamic_layout: 'no',
        mounting: 'standard',
        backing: 'wire_wall_hanger_paper_backing',
      },
    },
  },
];

export function getPrintProduct(
  variant: MerchInternalVariant
): PrintProduct | undefined {
  return PRINT_PRODUCTS.find((p) => p.variant === variant);
}
