import type { Sizing } from 'prodigi-print-api';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import MerchProvider from '../../enum/MerchProvider';
import type { ProdigiProduct } from '../prodigi/ProdigiProduct';
import type { WhccProduct } from '../whcc/WhccProduct';
import { getMerchProvider, type PrintVariant } from './merchCatalog';

// What each provider needs to print a variant.
export interface PrintProduct {
  variant: PrintVariant;
  [MerchProvider.PRODIGI]?: ProdigiProduct;
  [MerchProvider.WHCC]: WhccProduct;
}

const whccPhotoPrint = (size: string): WhccProduct => ({
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

const prodigiSizing: Sizing = 'fitPrintArea';

export const PRINT_PRODUCTS: PrintProduct[] = [
  {
    variant: MerchInternalVariant.PRINT_4X6,
    [MerchProvider.PRODIGI]: {
      sku: 'GLOBAL-PHO-4X6',
      attributes: {},
      sizing: prodigiSizing,
    },
    [MerchProvider.WHCC]: whccPhotoPrint('4x6'),
  },
  {
    variant: MerchInternalVariant.PRINT_8X12,
    [MerchProvider.PRODIGI]: {
      sku: 'GLOBAL-PHO-8X12',
      attributes: {},
      sizing: prodigiSizing,
    },
    [MerchProvider.WHCC]: whccPhotoPrint('8x12'),
  },
  {
    variant: MerchInternalVariant.PRINT_10X15,
    [MerchProvider.WHCC]: whccPhotoPrint('10x15'),
  },
  {
    variant: MerchInternalVariant.FRAMED_PRINT_8X12_WALL,
    [MerchProvider.PRODIGI]: {
      sku: 'GLOBAL-BOX-8X12',
      attributes: { color: 'black' },
      sizing: prodigiSizing,
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
  {
    variant: MerchInternalVariant.FRAMED_PRINT_5X7_EASEL,
    [MerchProvider.WHCC]: {
      productRef: 'framed-print',
      selections: {
        size: '5x7',
        moulding: 'gallery_fine_black',
        surface: 'photo_print',
        photo_print: 'lustre_photo_print',
        lamination: 'no',
        mat: 'no',
        acrylic: 'no',
        dynamic_layout: 'no',
        mounting: 'standard',
        backing: 'easel_back',
      },
    },
  },
];

export function getPrintProduct(
  variant: MerchInternalVariant
): PrintProduct | undefined {
  return PRINT_PRODUCTS.find((p) => p.variant === variant);
}

export interface PrintFrame {
  // WHCC's moulding id, such as gallery_fine_black.
  moulding: string;
  // The size of the print the frame holds, so a preview can draw the frame and opening to scale.
  printShortSideInches: number;
  printLongSideInches: number;
}

// The frame WHCC puts around the variant, when WHCC is the one printing it and it is framed.
export function getWhccFrame(
  variant: MerchInternalVariant
): PrintFrame | undefined {
  if (getMerchProvider(variant) !== MerchProvider.WHCC) {
    return undefined;
  }
  const { moulding, size } =
    getPrintProduct(variant)?.[MerchProvider.WHCC].selections ?? {};
  if (!moulding || !size) {
    return undefined;
  }
  // WHCC sizes are inches, written like 8x12.
  const sides = size.split('x').map(Number);
  if (sides.length !== 2 || !sides.every((side) => side > 0)) {
    return undefined;
  }
  return {
    moulding,
    printShortSideInches: Math.min(...sides),
    printLongSideInches: Math.max(...sides),
  };
}
