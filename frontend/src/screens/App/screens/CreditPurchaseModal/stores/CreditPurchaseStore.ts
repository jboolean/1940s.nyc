import { getPriceAmount, redirectToCheckout } from 'shared/utils/ColorApi';
import recordEvent from 'shared/utils/recordEvent';
import create from 'zustand';
import { immer } from 'zustand/middleware/immer';
import useLoginStore from '../../../../../shared/stores/LoginStore';

const PRESET_QUANTITIES = [50, 100, 200];

interface State {
  isOpen: boolean;
  selectedQuantity: number;
  quantityOptions: number[];
  errorMessage: string | null;
  isCheckingOut: boolean;
  isFollowMagicLinkMessageVisible: boolean;
  unitPrice: number | null;
}

interface Actions {
  open: () => void;
  close: () => void;
  setQuantity: (quantity: number) => void;
  handleCheckout: () => void;
}

const useCreditPurchaseModalStore = create(
  immer<State & Actions>((set, get) => ({
    isOpen: false,
    quantityOptions: PRESET_QUANTITIES,
    selectedQuantity: PRESET_QUANTITIES[1],
    errorMessage: null,
    isCheckingOut: false,
    isFollowMagicLinkMessageVisible: false,
    unitPrice: null,
    open: () => {
      set((draft) => {
        draft.isOpen = true;
      });

      useLoginStore.getState().initialize();

      getPriceAmount()
        .then((price) => {
          set((draft) => {
            draft.unitPrice = price;
          });
        })
        .catch((err: unknown) => {
          set((draft) => {
            console.error('Error fetching price', err);
            draft.errorMessage =
              'Something went wrong getting pricing information. Please try again later.';
          });
        });

      recordEvent({
        category: 'Colorization',
        action: 'Open credit purchase modal',
      });
    },

    close: () => {
      set((draft) => {
        draft.isOpen = false;
      });
    },

    setQuantity: (quantity: number) => {
      set((draft) => {
        draft.selectedQuantity = quantity;
      });
    },

    handleCheckout: async () => {
      try {
        set((draft) => {
          draft.isCheckingOut = true;
          draft.errorMessage = null;
        });

        await redirectToCheckout(get().selectedQuantity, get().unitPrice);
      } catch (error) {
        set((draft) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          draft.errorMessage = error?.message || 'Something went wrong';
        });
      } finally {
        set((draft) => {
          draft.isCheckingOut = false;
        });
      }
    },
  }))
);

export default useCreditPurchaseModalStore;
