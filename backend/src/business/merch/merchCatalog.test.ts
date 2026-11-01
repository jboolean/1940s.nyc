import MerchInternalVariant from '../../enum/MerchInternalVariant';
import type { PrintVariant as EntityPrintVariant } from '../../entities/MerchCustomizationOptions';
import { getPrintProduct, PRINT_PRODUCTS } from '../prodigi/printCatalog';
import {
  getMerchLabel,
  getMerchProvider,
  isPrintVariant,
  MERCH_CATALOG,
  PRINT_VARIANTS,
} from './merchCatalog';

// The entity spells the prints out because tsoa cannot resolve the derived union from the catalog.
// Requiring each side to be assignable to the other makes this fail to compile if they drift apart,
// so the prints are still stated in one place.
type CatalogPrintVariant = (typeof PRINT_VARIANTS)[number];
const entityUnionMatchesCatalog: [EntityPrintVariant] extends [
  CatalogPrintVariant,
]
  ? [CatalogPrintVariant] extends [EntityPrintVariant]
    ? true
    : never
  : never = true;

describe('merch catalog', () => {
  it('holds the entity print union level with the catalog', () => {
    expect(entityUnionMatchesCatalog).toBe(true);
  });

  it('lists every variant we sell', () => {
    expect(Object.keys(MERCH_CATALOG).sort()).toEqual(
      Object.values(MerchInternalVariant).sort()
    );
  });

  it('names the prints the same on both sides', () => {
    // The label moved out of printCatalog, so this catches a print that keeps a stale name there.
    for (const variant of PRINT_VARIANTS) {
      expect(getPrintProduct(variant)?.variant).toBe(variant);
      expect(getMerchLabel(variant)).not.toBe(variant);
    }
  });

  it('agrees with the Prodigi catalog on which variants are prints', () => {
    const productVariants = PRINT_PRODUCTS.map((p) => p.variant).sort();
    expect([...PRINT_VARIANTS].sort()).toEqual(productVariants);
    expect(isPrintVariant(MerchInternalVariant.TOTE_BAG_SMALL)).toBe(false);
  });

  it('sends every print to Prodigi and the tote to Printful', () => {
    expect(getMerchProvider(MerchInternalVariant.TOTE_BAG_SMALL)).toBe(
      'printful'
    );
    for (const variant of PRINT_VARIANTS) {
      expect(getMerchProvider(variant)).toBe('prodigi');
    }
  });
});
