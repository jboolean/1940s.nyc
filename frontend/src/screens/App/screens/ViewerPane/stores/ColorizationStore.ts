import create from 'zustand';
import { mountStoreDevtool } from 'simple-zustand-devtools';
import { immer } from 'zustand/middleware/immer';
import { API_BASE } from 'shared/utils/apiConstants';

interface State {
  colorEnabledForIdentifier: string | null;
  isLoading: boolean;
  colorizedImageSrc: string | null;
}

interface Actions {
  enableColorization: (identifier: string) => void;
  disableColorization: () => void;
  toggleColorization: (identifier: string) => void;

  // Image is loaded from the src attribute, so we need to know when it's done loading
  handleImageLoaded: () => void;
}

const useColorizationStore = create(
  immer<State & Actions>((set, get) => ({
    colorEnabledForIdentifier: null,
    isLoading: false,
    // colorizedImageData: null,
    colorizedImageSrc: null,

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
      });
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
  }))
);

if (__DEV__) {
  mountStoreDevtool('ColorizationStore', useColorizationStore);
}

export default useColorizationStore;
