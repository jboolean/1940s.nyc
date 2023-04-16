import { useExperimentVariants } from 'shared/utils/OptimizeExperiments';

const PRESET_OPTIONS_BY_VARIANT: Record<number, number[]> = {
  0: [2, 8, 16, 20],
  1: [5, 10, 20, 40],
};

export default function useAmountPresets(): number[] {
  const [presetsVariant] = [
    useExperimentVariants('wLWeVH_USHuTlkUtAK9Erw'),
    [0],
  ].find((v) => Array.isArray(v));
  const amountPresets = PRESET_OPTIONS_BY_VARIANT[presetsVariant];

  return amountPresets;
}
