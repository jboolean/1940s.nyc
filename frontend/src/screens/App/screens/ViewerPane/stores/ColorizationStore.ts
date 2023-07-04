import recordEvent from 'shared/utils/recordEvent';
import { mountStoreDevtool } from 'simple-zustand-devtools';
import create from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { openCreditPurchaseModal } from '../../CreditPurchaseModal';

import * as ColorApi from 'utils/ColorApi';

interface State {
  colorEnabledForIdentifier: string | null;
  isLoading: boolean;
  colorizedImageSrc: string | null;

  balance: number | null;
}

interface Actions {
  enableColorization: (identifier: string) => void;
  disableColorization: () => void;
  toggleColorization: (identifier: string) => void;

  // Image is loaded from the src attribute, so we need to know when it's done loading
  handleImageLoaded: () => void;
  handleImageError: () => void;

  refreshBalance: () => Promise<number>;
}

const useColorizationStore = create(
  immer<State & Actions>((set, get) => ({
    colorEnabledForIdentifier: null,
    isLoading: false,
    colorizedImageSrc: null,
    balance: null,

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
        draft.colorizedImageSrc =
          ColorApi.getColorizedImageUrl(photoIdentifier);

        recordEvent({
          category: 'Colorization',
          action: 'Click Colorize',
        });
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
      void get().refreshBalance();
    },

    // This is a total hack
    // There was a CORS issue making the image request from javascript, so we use an img tag, which works
    // But error codes or messages cannot be returned from an img tag, so we can only check the balance and guess if the error was due to lack of balance
    handleImageError: async () => {
      set((draft) => {
        draft.isLoading = false;
        draft.colorEnabledForIdentifier = null;
        draft.colorizedImageSrc = null;
      });

      const balance = await get().refreshBalance();
      const hasBalance = balance > 0;

      if (!hasBalance) {
        openCreditPurchaseModal();
        return;
      }

      console.error('Error loading colorized image, but balance is positive');

      alert(
        'The image could not be colorized, even though you have a credit balance. ' +
          'Please contact me if the issue persists.' +
          '  - Julian (julian@1940s.nyc)'
      );
    },

    refreshBalance: async () => {
      const balance = await ColorApi.getBalance();
      set((draft) => {
        draft.balance = balance;
      });
      return balance;
    },
  }))
);

if (__DEV__) {
  mountStoreDevtool('ColorizationStore', useColorizationStore);
}

export default useColorizationStore;
