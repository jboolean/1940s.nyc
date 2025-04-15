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

type MerchCustomizationOptions = ToteBagCustomizationOptions;

export default MerchCustomizationOptions;
