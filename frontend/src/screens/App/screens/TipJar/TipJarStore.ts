import recordEvent from 'shared/utils/recordEvent';
import create from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import redirectToCheckout from './redirectToCheckout';
import pick from 'lodash/pick';

const TIP_JAR_DELAY = /* 2 minutes */ 1000 * 60 * 2;
const RE_ENGAGE_DELAY = /* 3 months */ 1000 * 60 * 60 * 24 * 30 * 3;

type Variant = 'default' | 'colorization';

interface Actions {
  open(variant?: Variant): void;
  handleSubmit(): Promise<void>;
  handleRequestClose(): void;
  setAmountDollars(amountDollars: number): void;
}

interface State {
  amountDollars?: number;
  isOpen: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  openedOn?: number;
  variant: 'default' | 'colorization';
}

const useTipJarStore = create(
  persist(
    immer<State & Actions>((set, get) => ({
      isOpen: false,
      isSubmitting: false,
      amountDollars: undefined,
      errorMessage: null,
      variant: 'default',

      open: (variant: Variant = 'default') => {
        set((draft) => {
          draft.isOpen = true;
          draft.openedOn = new Date().getTime();
          draft.variant = variant;
        });
      },
      handleSubmit: async () => {
        const { amountDollars } = get();
        if (Number.isNaN(amountDollars) || amountDollars <= 0) return;
        set((draft) => {
          draft.isSubmitting = true;
          draft.errorMessage = null;
        });

        recordEvent({
          category: 'Tip Jar',
          action: 'Click Checkout',
          value: amountDollars * 100,
        });
        try {
          // Input is dollars, convert to cents
          await redirectToCheckout(amountDollars * 100);
        } catch (error) {
          set((draft) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            draft.errorMessage = error?.message || 'Something went wrong';
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
        });
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
