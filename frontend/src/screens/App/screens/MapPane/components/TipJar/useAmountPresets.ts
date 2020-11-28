import { useExperimentVariants } from 'shared/utils/OptimizeExperiments';

const PRESET_OPTIONS_BY_VARIANT: Record<number, number[]> = {
  0: [2, 4, 8, 16],
  1: [5, 10, 15, 20],
};

export default function useAmountPresets(): number[] {
  const [presetsVariant] = useExperimentVariants('3ZKjTkKGTCKl8Rk7a47wlQ') || [
    0,
  ];
  const amountPresets = PRESET_OPTIONS_BY_VARIANT[presetsVariant];

  return amountPresets;
}
