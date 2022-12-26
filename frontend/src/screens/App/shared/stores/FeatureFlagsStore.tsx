import create from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import FeatureFlag from '../types/FeatureFlag';

// Map all FeatureFlags to false
const initialFeatureFlags = Object.keys(FeatureFlag).reduce<
  Partial<Record<FeatureFlag, false>>
>((acc, key: FeatureFlag) => {
  acc[key] = false;
  return acc;
}, {}) as Record<FeatureFlag, false>;

type State = {
  [feature in FeatureFlag]: boolean;
};

interface Actions {
  setFeatureFlag: (feature: FeatureFlag, value: boolean) => void;
}

const useFeatureFlagsStore = create(
  persist(
    immer<State & Actions>((set, get) => ({
      ...initialFeatureFlags,

      setFeatureFlag(feature: FeatureFlag, value: boolean) {
        set((draft) => {
          draft[feature] = value;
        });
      },
    })),
    {
      name: 'featureFlags',
      getStorage: () => localStorage,
    }
  )
);

export const useFeatureFlag = (feature: FeatureFlag): boolean => {
  return useFeatureFlagsStore((state) => state[feature]);
};

export default useFeatureFlagsStore;
