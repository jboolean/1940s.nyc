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

export type PrintVariant =
  | MerchInternalVariant.PRINT_HPR_4X6
  | MerchInternalVariant.PRINT_HPR_8X12
  | MerchInternalVariant.PRINT_FAP_8X12_FRAMED;

export interface PrintCustomizationOptions {
  variant: PrintVariant;
  photoIdentifier: string;
  colorize: boolean;
  // Print file generation bookkeeping, written by the render cron.
  printfile?: { attempts: number; lastError?: string };
}

type MerchCustomizationOptions =
  ToteBagCustomizationOptions | PrintCustomizationOptions;

export default MerchCustomizationOptions;
