import MerchInternalVariant from '../../enum/MerchInternalVariant';
import absurd from '../utils/absurd';
import isProduction from '../utils/isProduction';
import { CatalogItem as PrintfulCatalogItem } from '../utils/printfulApi';

const INTERNAL_VARIANT_TO_PRINTFUL_VARIANT: Record<
  MerchInternalVariant,
  number
> = {
  [MerchInternalVariant.TOTE_BAG_SMALL]: 4533, // Product 84
};

export function getPrintfileKey(customMerchItemId: number): string {
  const destinationDirectory = isProduction() ? 'printfiles' : 'printfiles-dev';
  return `merch/${destinationDirectory}/${customMerchItemId}.png`;
}

export function getPrintfileUrl(customMerchItemId: number): string {
  const destinationKey = getPrintfileKey(customMerchItemId);

  return `https://photos.1940s.nyc/${destinationKey}`;
}

export function makePrintfulItem(
  customMerchItemId: number,
  internalVariant: MerchInternalVariant
): PrintfulCatalogItem {
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
                url: getPrintfileUrl(customMerchItemId),
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
