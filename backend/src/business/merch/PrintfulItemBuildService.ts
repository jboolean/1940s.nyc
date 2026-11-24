import type MerchOrderItem from '../../entities/MerchOrderItem';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import { getPrintfileDirectUrl, PrintfileItem } from '../utils/printfileUtils';
import { CatalogItemWritable as PrintfulCatalogItemWritable } from '../utils/printfulApi';

export const INTERNAL_VARIANT_TO_PRINTFUL_VARIANT: Record<
  MerchInternalVariant.TOTE_BAG_SMALL,
  number
> = {
  [MerchInternalVariant.TOTE_BAG_SMALL]: 4533, // Product 84
};

export function makePrintfulItem(
  item: PrintfileItem & Pick<MerchOrderItem, 'internalVariant'>
): PrintfulCatalogItemWritable {
  const { internalVariant } = item;
  switch (internalVariant) {
    case MerchInternalVariant.TOTE_BAG_SMALL:
      return {
        source: 'catalog',
        catalog_variant_id:
          INTERNAL_VARIANT_TO_PRINTFUL_VARIANT[internalVariant],
        external_id: item.id.toString(),
        placements: [
          {
            placement: 'default',
            technique: 'cut-sew',
            print_area_type: 'advanced',
            layers: [
              {
                type: 'file',
                url: getPrintfileDirectUrl(item, 'png'),
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
