import { redirectToCheckout } from 'shared/utils/ColorApi';
import create from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { LoginOutcome, processLoginRequest } from '../utils/CreditsApi';

const PRESET_QUANTITIES = [20, 50, 100, 200];

interface State {
  isOpen: boolean;
  emailAddress: string;
  isLoginValidated: boolean;
  selectedQuantity: number;
  quantityOptions: number[];
  errorMessage: string | null;
  isCheckingOut: boolean;
  isFollowMagicLinkMessageVisible: boolean;
}

interface Actions {
  open: () => void;
  close: () => void;
  onEmailAddressChange: (emailAddress: string) => void;
  onSubmitLogin: () => void;
  setQuantity: (quantity: number) => void;
  handleCheckout: () => void;
}

const useCreditPurchaseModalStore = create(
  immer<State & Actions>((set, get) => ({
    isOpen: false,
    emailAddress: '',
    isLoginValidated: false,
    quantityOptions: PRESET_QUANTITIES,
    selectedQuantity: PRESET_QUANTITIES[1],
    errorMessage: null,
    isCheckingOut: false,
    isFollowMagicLinkMessageVisible: false,
    open: () => {
      set((draft) => {
        draft.isOpen = true;
      });
    },

    close: () => {
      set((draft) => {
        draft.isOpen = false;
      });
    },

    onEmailAddressChange: (emailAddress: string) => {
      set((draft) => {
        draft.emailAddress = emailAddress;
        draft.isFollowMagicLinkMessageVisible = false;
        draft.isLoginValidated = false;
      });
    },

    onSubmitLogin: async () => {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('noWelcome', 'true');
      const returnToPath =
        window.location.pathname +
        '?' +
        searchParams.toString() +
        window.location.hash;
      const outcome = await processLoginRequest(
        get().emailAddress,
        returnToPath
      );
      if (
        outcome === LoginOutcome.AlreadyAuthenticated ||
        outcome === LoginOutcome.UpdatedEmailOnAuthenticatedAccount
      ) {
        set((draft) => {
          // We stay logged into the current account and can proceed
          draft.isLoginValidated = true;
        });
      } else if (outcome === LoginOutcome.SentLinkToExistingAccount) {
        set((draft) => {
          // The user must follow the link to log into another account
          draft.isFollowMagicLinkMessageVisible = true;
        });
      }
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

        await redirectToCheckout(get().selectedQuantity);
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
