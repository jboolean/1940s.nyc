import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createJSONStorage, persist } from 'zustand/middleware';
import FeatureFlag from '../types/FeatureFlag';

// Map all FeatureFlags to false
const initialFeatureFlags = Object.values(FeatureFlag).reduce<
  Partial<Record<FeatureFlag, boolean>>
>((acc, key: FeatureFlag) => {
  acc[key] = false;
  return acc;
}, {}) as Record<FeatureFlag, boolean>;

type State = {
  [feature in FeatureFlag]: boolean;
};

interface Actions {
  setFeatureFlag: (feature: FeatureFlag, value: boolean) => void;
}

const useFeatureFlagsStore = create(
  persist(
    immer<State & Actions>((set) => ({
      ...initialFeatureFlags,

      setFeatureFlag(feature: FeatureFlag, value: boolean) {
        set((draft) => {
          draft[feature] = value;
        });
      },
    })),
    {
      name: 'featureFlags',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useFeatureFlag = (feature: FeatureFlag): boolean => {
  return useFeatureFlagsStore((state) => state[feature]);
};

export default useFeatureFlagsStore;
