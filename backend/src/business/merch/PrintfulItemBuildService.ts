import MerchInternalVariant from '../../enum/MerchInternalVariant';
import { getPrintfileDirectUrl } from '../utils/printfileUtils';
import { CatalogItemWritable as PrintfulCatalogItemWritable } from '../utils/printfulApi';

const INTERNAL_VARIANT_TO_PRINTFUL_VARIANT: Record<
  MerchInternalVariant.TOTE_BAG_SMALL,
  number
> = {
  [MerchInternalVariant.TOTE_BAG_SMALL]: 4533, // Product 84
};

export function makePrintfulItem(
  customMerchItemId: number,
  internalVariant: MerchInternalVariant
): PrintfulCatalogItemWritable {
  switch (internalVariant) {
    case MerchInternalVariant.TOTE_BAG_SMALL:
      return {
        source: 'catalog',
        catalog_variant_id:
          INTERNAL_VARIANT_TO_PRINTFUL_VARIANT[internalVariant],
        external_id: customMerchItemId.toString(),
        placements: [
          {
            placement: 'default',
            technique: 'cut-sew',
            print_area_type: 'advanced',
            layers: [
              {
                type: 'file',
                url: getPrintfileDirectUrl(customMerchItemId),
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
      throw new Error(`Printful does not fulfill ${internalVariant}`);
  }
}
