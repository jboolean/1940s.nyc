import create from 'zustand';
import { mountStoreDevtool } from 'simple-zustand-devtools';
import { immer } from 'zustand/middleware/immer';
import { API_BASE } from 'shared/utils/apiConstants';
import { useTipJarStore } from '../../TipJar';

const TIP_JAR_COUNT_THRESHOLD = 3;
const TIP_JAR_DELAY = /* 10 seconds */ 1000 * 6;
const TIP_JAR_REPEAT_EVERY = 4;

interface State {
  colorEnabledForIdentifier: string | null;
  isLoading: boolean;
  colorizedImageSrc: string | null;

  // Track images, so that after so many we can popup the tip jar
  colorizedImageHistory: Array<string>;
}

interface Actions {
  enableColorization: (identifier: string) => void;
  disableColorization: () => void;
  toggleColorization: (identifier: string) => void;

  // Image is loaded from the src attribute, so we need to know when it's done loading
  handleImageLoaded: () => void;
  handleImageError: () => void;
}

const useColorizationStore = create(
  immer<State & Actions>((set, get) => ({
    colorEnabledForIdentifier: null,
    isLoading: false,
    // colorizedImageData: null,
    colorizedImageSrc: null,
    colorizedImageHistory: [],

    toggleColorization: (identifier: string) => {
      const { colorEnabledForIdentifier } = get();
      if (colorEnabledForIdentifier === identifier) {
        get().disableColorization();
      } else {
        get().enableColorization(identifier);
      }
    },

    enableColorization: (photoIdentifier: string) => {
      set((draft) => {
        draft.colorEnabledForIdentifier = photoIdentifier;
        draft.isLoading = true;
        draft.colorizedImageSrc = `${API_BASE}/colorization/colorized/${photoIdentifier}`;

        if (!get().colorizedImageHistory.includes(photoIdentifier)) {
          draft.colorizedImageHistory.push(photoIdentifier);
        }
      });

      // If you have colored 3 images, or every 5 images after that, show the tip jar if they haven't paid
      const nColored = get().colorizedImageHistory.length;
      const hasTipped = window.localStorage.getItem('hasTipped') === 'true';
      if (
        !hasTipped &&
        (nColored === TIP_JAR_COUNT_THRESHOLD ||
          (nColored - TIP_JAR_COUNT_THRESHOLD) % TIP_JAR_REPEAT_EVERY === 0)
      ) {
        setTimeout(() => {
          useTipJarStore.getState().open('colorization');
        }, TIP_JAR_DELAY);
      }
    },
    disableColorization: () => {
      set((draft) => {
        draft.colorEnabledForIdentifier = null;
        draft.isLoading = false;
        // We intentionally don't clear the colorized image src here to allow it to fade out
      });
    },
    handleImageLoaded: () => {
      set((draft) => {
        draft.isLoading = false;
      });
    },
    handleImageError: () => {
      set((draft) => {
        draft.isLoading = false;
        draft.colorEnabledForIdentifier = null;
        draft.colorizedImageSrc = null;
      });
    },
  }))
);

if (__DEV__) {
  mountStoreDevtool('ColorizationStore', useColorizationStore);
}

export default useColorizationStore;
