import type { Sizing } from 'prodigi-print-api';
import MerchInternalVariant from '../../enum/MerchInternalVariant';

export type PaperFamily = 'HPR' | 'FAP' | 'PHO';

/**
 * The paper family sold for unframed prints. Change this one value to switch between:
 *  - HPR: Hahnemuhle Photo Rag, 308gsm fine art cotton paper
 *  - FAP: Enhanced Matte Art paper, 200gsm
 *  - PHO: Professional C-Type silver halide photo print, lustre finish
 * A Stripe product and price must exist for each variant of the chosen family.
 */
export const PRINT_PAPER_FAMILY: PaperFamily = 'HPR';

// Photos in the 1940s collection are 2800x4200 (2:3), so the whole photo is kept and
// never stretched: fitPrintArea shrinks it to fit and pads with white if the product's
// ratio differs. fillPrintArea would crop and stretchToPrintArea would distort.
const PRINT_SIZING: Sizing = 'fitPrintArea';

export interface PrintProduct {
  variant: MerchInternalVariant;
  paperFamily: PaperFamily;
  sku: string;
  attributes: Record<string, string>;
  sizing: Sizing;
  framed: boolean;
  label: string;
  // Print area in pixels, as reported by GET /v4.0/products/<sku>.
  printAreaPx: { width: number; height: number };
}

const PRO_LUSTRE = { finish: 'lustre' };
const BLACK_FRAME = { color: 'black' };

const PRINT_PRODUCTS: PrintProduct[] = [
  {
    variant: MerchInternalVariant.PRINT_HPR_4X6,
    paperFamily: 'HPR',
    sku: 'GLOBAL-HPR-4X6',
    attributes: {},
    sizing: PRINT_SIZING,
    framed: false,
    label: '4×6 in print',
    printAreaPx: { width: 1200, height: 1800 },
  },
  {
    variant: MerchInternalVariant.PRINT_HPR_8X12,
    paperFamily: 'HPR',
    sku: 'GLOBAL-HPR-8X12',
    attributes: {},
    sizing: PRINT_SIZING,
    framed: false,
    label: '8×12 in print',
    printAreaPx: { width: 2400, height: 3600 },
  },
  {
    variant: MerchInternalVariant.PRINT_FAP_4X6,
    paperFamily: 'FAP',
    sku: 'GLOBAL-FAP-4X6',
    attributes: {},
    sizing: PRINT_SIZING,
    framed: false,
    label: '4×6 in print',
    printAreaPx: { width: 1200, height: 1800 },
  },
  {
    variant: MerchInternalVariant.PRINT_FAP_8X12,
    paperFamily: 'FAP',
    sku: 'GLOBAL-FAP-8X12',
    attributes: {},
    sizing: PRINT_SIZING,
    framed: false,
    label: '8×12 in print',
    printAreaPx: { width: 2400, height: 3600 },
  },
  {
    variant: MerchInternalVariant.PRINT_PHO_4X6,
    paperFamily: 'PHO',
    sku: 'GLOBAL-PHO-4X6-PRO',
    attributes: PRO_LUSTRE,
    sizing: PRINT_SIZING,
    framed: false,
    label: '4×6 in print',
    printAreaPx: { width: 1200, height: 1800 },
  },
  {
    variant: MerchInternalVariant.PRINT_PHO_8X12,
    paperFamily: 'PHO',
    sku: 'GLOBAL-PHO-8X12-PRO',
    attributes: PRO_LUSTRE,
    sizing: PRINT_SIZING,
    framed: false,
    label: '8×12 in print',
    printAreaPx: { width: 2400, height: 3600 },
  },
  // Framed prints are always on Prodigi's EMA paper (the FAP family), whatever PRINT_PAPER_FAMILY is.
  // Prodigi has no 8x12 box frame (box frames start at 5x7 and none are 3:2), so this is the 8x12 classic frame.
  {
    variant: MerchInternalVariant.PRINT_FAP_8X12_FRAMED,
    paperFamily: 'FAP',
    sku: 'GLOBAL-CFP-8X12',
    attributes: BLACK_FRAME,
    sizing: PRINT_SIZING,
    framed: true,
    label: '8×12 in framed print',
    printAreaPx: { width: 2400, height: 3600 },
  },
];

const PRODUCTS_BY_VARIANT = new Map(PRINT_PRODUCTS.map((p) => [p.variant, p]));

export function isPrintVariant(variant: MerchInternalVariant): boolean {
  return PRODUCTS_BY_VARIANT.has(variant);
}

export function getPrintProduct(variant: MerchInternalVariant): PrintProduct {
  const product = PRODUCTS_BY_VARIANT.get(variant);
  if (!product) {
    throw new Error(`${variant} is not a print product`);
  }
  return product;
}

export function getAllPrintProducts(): readonly PrintProduct[] {
  return PRINT_PRODUCTS;
}

// Variants offered for sale: the unframed prints of the chosen paper plus the framed print.
export function getActivePrintProducts(): PrintProduct[] {
  return PRINT_PRODUCTS.filter(
    (p) => p.framed || p.paperFamily === PRINT_PAPER_FAMILY
  );
}
