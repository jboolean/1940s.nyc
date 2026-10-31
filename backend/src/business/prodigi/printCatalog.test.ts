import MerchInternalVariant from '../../enum/MerchInternalVariant';
import {
  getActivePrintProducts,
  getAllPrintProducts,
  getPrintProduct,
  isPrintVariant,
} from './printCatalog';

// Photos in the 1940s collection are 2800x4200.
const PHOTO_RATIO = 2 / 3;

describe('print catalog', () => {
  it('has a product for every print variant and none for other variants', () => {
    const printVariants = Object.values(MerchInternalVariant).filter((v) =>
      v.startsWith('print-')
    );
    expect(
      getAllPrintProducts()
        .map((p) => p.variant)
        .sort()
    ).toEqual([...printVariants].sort());
    expect(isPrintVariant(MerchInternalVariant.TOTE_BAG_SMALL)).toBe(false);
    expect(() =>
      getPrintProduct(MerchInternalVariant.TOTE_BAG_SMALL)
    ).toThrow();
  });

  it('never crops or stretches the photo', () => {
    for (const product of getAllPrintProducts()) {
      expect(product.sizing).toBe('fitPrintArea');
    }
  });

  it('only uses print areas that match the photo ratio', () => {
    for (const { printAreaPx, variant } of getAllPrintProducts()) {
      expect([variant, printAreaPx.width / printAreaPx.height]).toEqual([
        variant,
        PHOTO_RATIO,
      ]);
    }
  });

  it('encodes paper, size and framing in the variant id', () => {
    for (const p of getAllPrintProducts()) {
      expect(p.variant).toMatch(
        new RegExp(`^print-${p.paperFamily.toLowerCase()}-\\d+x\\d+(-framed)?$`)
      );
      expect(p.variant.endsWith('-framed')).toBe(p.framed);
    }
  });

  it('offers the chosen paper unframed plus the framed print', () => {
    const active = getActivePrintProducts();
    expect(
      active.filter((p) => !p.framed).every((p) => p.paperFamily === 'HPR')
    ).toBe(true);
    expect(active.filter((p) => p.framed)).toHaveLength(1);
  });

  it('uses black frames', () => {
    expect(
      getPrintProduct(MerchInternalVariant.PRINT_FAP_8X12_FRAMED).attributes
    ).toEqual({ color: 'black' });
  });
});
