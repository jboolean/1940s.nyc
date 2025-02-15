import MerchInternalVariant from '../enum/MerchInternalVariant';

interface ToteBagCustomizationOptions {
  variant: MerchInternalVariant.TOTE_BAG_SMALL;
  lat: number;
  lon: number;
}

type MerchCustomizationOptions = ToteBagCustomizationOptions;

export default MerchCustomizationOptions;
