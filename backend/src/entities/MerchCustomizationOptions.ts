import type { PrintVariant } from '../business/merch/merchCatalog';
import MerchInternalVariant from '../enum/MerchInternalVariant';

type Color = 'red' | 'green' | 'creme' | 'dark';

interface ToteBagCustomizationOptions {
  variant: MerchInternalVariant.TOTE_BAG_SMALL;
  lat: number;
  lng: number;
  style?: 'outline' | 'solid';
  foregroundColor?: Color;
  backgroundColor?: Color;
}

export interface PrintCustomizationOptions {
  variant: PrintVariant;
  photoIdentifier: string;
  colorize: boolean;
}

type MerchCustomizationOptions =
  ToteBagCustomizationOptions | PrintCustomizationOptions;

export default MerchCustomizationOptions;
