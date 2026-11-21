import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createJSONStorage, persist } from 'zustand/middleware';
import FeatureFlag from '../types/FeatureFlag';

const DEFAULTS_ON: FeatureFlag[] = [FeatureFlag.PRINT_ORDERS];

// Map all FeatureFlags to false, except those that are on by default
const initialFeatureFlags = Object.values(FeatureFlag).reduce<
  Partial<Record<FeatureFlag, boolean>>
>((acc, key: FeatureFlag) => {
  acc[key] = DEFAULTS_ON.includes(key);
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
      version: 1,
      // Visitors saved print-orders:false before it defaulted on; turn it on
      // once for them. Later explicit choices are stored at the new version.
      migrate: (persisted, version) => {
        const state = persisted as State & Actions;
        if (version < 1) {
          return { ...state, [FeatureFlag.PRINT_ORDERS]: true };
        }
        return state;
      },
    }
  )
);

export const useFeatureFlag = (feature: FeatureFlag): boolean => {
  return useFeatureFlagsStore((state) => state[feature]);
};

export default useFeatureFlagsStore;
