import MerchInternalVariant from '../enum/MerchInternalVariant';

interface ToteBagCustomizationOptions {
  variant: MerchInternalVariant.TOTE_BAG_SMALL;
  lat: number;
  lng: number;
  style: 'outline' | 'solid';
  foregroundColor: 'red' | 'green' | 'creme' | 'dark';
  backgroundColor: 'red' | 'green' | 'creme' | 'dark';
}

type MerchCustomizationOptions = ToteBagCustomizationOptions;

export default MerchCustomizationOptions;
