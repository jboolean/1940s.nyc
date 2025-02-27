// import { useExperimentVariants } from 'shared/utils/OptimizeExperiments';

import absurd from 'shared/utils/absurd';
import TipFrequency from './utils/TipFrequency';

// const PRESET_OPTIONS_BY_VARIANT: Record<number, number[]> = {
//   0: [2, 8, 16, 20],
//   1: [5, 10, 20, 40],
// };

export default function useAmountPresets(
  frequency: TipFrequency = TipFrequency.ONCE
): number[] {
  // const [presetsVariant] = [
  //   useExperimentVariants('wLWeVH_USHuTlkUtAK9Erw'),
  //   [0],
  // ].find((v) => Array.isArray(v));
  // const amountPresets = PRESET_OPTIONS_BY_VARIANT[presetsVariant];

  // return amountPresets;

  switch (frequency) {
    case TipFrequency.ONCE:
      return [4, 8, 19.4, 40, 100];
    case TipFrequency.MONTHLY:
      return [2, 4, 7, 19.4];
    default:
      absurd(frequency);
  }
}
