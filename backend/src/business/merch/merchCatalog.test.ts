import MerchInternalVariant from '../../enum/MerchInternalVariant';
import { getPrintProduct, PRINT_PRODUCTS } from '../prodigi/printCatalog';
import {
  getMerchLabel,
  getMerchProvider,
  isPrintVariant,
  MERCH_CATALOG,
  PRINT_VARIANTS,
} from './merchCatalog';

describe('merch catalog', () => {
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
