import MerchInternalVariant from '../enum/MerchInternalVariant';

type Color = 'red' | 'green' | 'creme' | 'dark';

export interface ToteBagCustomizationOptions {
  variant: MerchInternalVariant.TOTE_BAG_SMALL;
  lat: number;
  lng: number;
  style?: 'outline' | 'solid';
  foregroundColor?: Color;
  backgroundColor?: Color;
}

// Written out rather than derived from the catalog: tsoa cannot resolve the indexed-access type the
// derivation uses, and route generation aborts on it. merchCatalog.test holds this list to the
// catalog's, so the prints are still stated in one place.
export type PrintVariant =
  | MerchInternalVariant.PRINT_HPR_4X6
  | MerchInternalVariant.PRINT_HPR_8X12
  | MerchInternalVariant.PRINT_FAP_8X12_FRAMED;

export interface PrintCustomizationOptions {
  // The variant is the whole set rather than just the prints because the entity is also the request
  // body tsoa has to turn into a schema, and it cannot resolve the narrower PrintVariant type.
  // isPrintVariant is what holds a stored row to the prints.
  variant: MerchInternalVariant;
  photoIdentifier: string;
  colorize: boolean;
}

type MerchCustomizationOptions =
  ToteBagCustomizationOptions | PrintCustomizationOptions;

export default MerchCustomizationOptions;
