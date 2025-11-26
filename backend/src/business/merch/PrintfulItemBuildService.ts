import MerchInternalVariant from '../../enum/MerchInternalVariant';
import absurd from '../utils/absurd';
import { getPrintfileUrl } from '../utils/printfileUtils';
import { CatalogItem as PrintfulCatalogItem } from '../utils/printfulApi';

const INTERNAL_VARIANT_TO_PRINTFUL_VARIANT: Record<
  MerchInternalVariant,
  number
> = {
  [MerchInternalVariant.TOTE_BAG_SMALL]: 4533, // Product 84
};

export async function makePrintfulItem(
  customMerchItemId: number,
  internalVariant: MerchInternalVariant
): Promise<PrintfulCatalogItem> {
  const printfulVariantId =
    INTERNAL_VARIANT_TO_PRINTFUL_VARIANT[internalVariant];
  switch (internalVariant) {
    case MerchInternalVariant.TOTE_BAG_SMALL:
      return {
        source: 'catalog',
        catalog_variant_id: printfulVariantId,
        external_id: customMerchItemId.toString(),
        placements: [
          {
            placement: 'default',
            technique: 'cut-sew',
            print_area_type: 'advanced',
            layers: [
              {
                type: 'file',
                url: await getPrintfileUrl(customMerchItemId, false),
              },
            ],
          },
        ],
        product_options: [
          {
            name: 'stitch_color',
            value: 'clear',
          },
        ],
      };
    default:
      absurd(internalVariant);
  }
}
