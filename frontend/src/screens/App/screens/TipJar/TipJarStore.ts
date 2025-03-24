import { Draft } from 'immer';
import pick from 'lodash/pick';
import useLoginStore from 'shared/stores/LoginStore';
import recordEvent from 'shared/utils/recordEvent';
import create from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import redirectToCheckout from './redirectToCheckout';
import redirectToCustomerPortal from './redirectToCustomerPortal';
import Gift from './utils/Gift';
import TipFrequency from './utils/TipFrequency';
import getGifts from './utils/TipsApi';

const TIP_JAR_DELAY = /* 2 minutes */ 1000 * 60 * 2;
const RE_ENGAGE_DELAY = /* 3 months */ 1000 * 60 * 60 * 24 * 30 * 3;

type Variant = 'default' | 'colorization';

interface Actions {
  open(variant?: Variant): void;
  handleSubmit(): Promise<void>;
  handleRequestClose(): void;
  setAmountDollars(amountDollars: number): void;
  setFrequency(frequency: TipFrequency): void;
  setSelectedGift(gift: Gift['gift'] | null): void;
  openLogin: () => void;
  closeLogin: () => void;
  redirectToCustomerPortal: () => Promise<void>;
}

interface State {
  amountDollars?: number;
  isOpen: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  openedOn?: number;
  variant: 'default' | 'colorization';
  frequency?: TipFrequency;
  allGifts: Gift[];
  selectedGift: Gift['gift'] | null;
  isLoginOpen: boolean;
}

// Shared helper for validating the selected gift
const validateSelectedGift = (draft: Draft<State>): void => {
  const { frequency, selectedGift, allGifts, amountDollars } = draft;
  const giftObject = allGifts.find(
    (g) => g.gift === selectedGift && g.frequency === frequency
  );
  if (
    giftObject &&
    (amountDollars === undefined ||
      amountDollars < giftObject.minimumAmount / 100)
  ) {
    draft.selectedGift = null;
  }
};

const useTipJarStore = create(
  persist(
    immer<State & Actions>((set, get) => ({
      isOpen: false,
      isSubmitting: false,
      amountDollars: undefined,
      errorMessage: null,
      variant: 'default',
      frequency: TipFrequency.MONTHLY,
      allGifts: [],
      selectedGift: null,
      isLoginOpen: false,

      open: (variant: Variant = 'default') => {
        set((draft) => {
          draft.isOpen = true;
          draft.openedOn = new Date().getTime();
          draft.variant = variant;
          draft.isLoginOpen = false;
        });
        getGifts()
          .then((gifts) => {
            set((draft) => {
              draft.allGifts = gifts;
            });
          })
          .catch((error) => {
            console.error('Failed to fetch gifts', error);
          });
      },
      handleSubmit: async () => {
        const { amountDollars, frequency, selectedGift } = get();
        if (Number.isNaN(amountDollars) || amountDollars <= 0) return;
        set((draft) => {
          draft.isSubmitting = true;
          draft.errorMessage = null;
        });

        const amountMinorUnits = Math.round(amountDollars * 100);

        recordEvent({
          category: 'Tip Jar',
          action: 'Click Checkout',
          value: amountMinorUnits,
        });
        try {
          // Input is dollars, convert to cents
          await redirectToCheckout(
            amountMinorUnits,
            frequency,
            selectedGift ?? undefined
          );
        } catch (error) {
          set((draft) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            draft.errorMessage =
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              error?.response?.data?.error ??
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              (error?.message || 'Something went wrong');
          });
        } finally {
          set((draft) => {
            draft.isSubmitting = false;
          });
        }
      },
      handleRequestClose: () => {
        set((draft) => {
          draft.isOpen = false;
          draft.amountDollars = undefined;
        });
      },
      setAmountDollars: (amountDollars: number) => {
        set((draft) => {
          draft.amountDollars = amountDollars;
          validateSelectedGift(draft);
        });
      },
      setFrequency: (frequency: TipFrequency) => {
        set((draft) => {
          draft.frequency = frequency;
          validateSelectedGift(draft);
        });
      },
      setSelectedGift: (gift: Gift['gift'] | null) => {
        const { frequency, amountDollars, allGifts } = get();
        const giftObject = allGifts.find(
          (g) => g.gift === gift && g.frequency === frequency
        );
        if (!giftObject) {
          set((draft) => {
            draft.selectedGift = null;
          });
          return;
        }
        const minimumAmountDollars = giftObject.minimumAmount / 100;
        // If the selected gift has a minimum amount and the current amount is less than that, set the amount to the minimum
        if (
          giftObject &&
          (!amountDollars || amountDollars < minimumAmountDollars)
        ) {
          set((draft) => {
            draft.amountDollars = minimumAmountDollars;
          });
        }
        set((draft) => {
          draft.selectedGift = gift;
        });
      },
      openLogin: () => {
        set((draft) => {
          draft.isLoginOpen = true;
          useLoginStore.getState().initialize();
        });
      },
      closeLogin: () => {
        set((draft) => {
          draft.isLoginOpen = false;
        });
      },
      redirectToCustomerPortal: async () => {
        await redirectToCustomerPortal();
      },
    })),
    {
      name: 'tip-jar',
      getStorage: () => localStorage,
      partialize: (state) => pick(state, 'openedOn'),
    }
  )
);

// Auto-open tip jar
setTimeout(() => {
  const { openedOn, open } = useTipJarStore.getState();
  if (!openedOn || new Date().getTime() - openedOn > RE_ENGAGE_DELAY) {
    open();
  }
}, TIP_JAR_DELAY);

export default useTipJarStore;
