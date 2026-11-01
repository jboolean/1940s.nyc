import useLoginStore from 'shared/stores/LoginStore';
import { MerchInternalVariant } from 'shared/utils/merch/Order';
import { getPhoto, Photo } from 'shared/utils/photosApi';
import recordEvent from 'shared/utils/recordEvent';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import usePrintCartStore from '../../PrintCart/stores/PrintCartStore';
import {
  createPrintCheckoutSession,
  getAvailablePrintProducts,
  PrintProductApiResponse,
} from '../utils/PrintCheckoutApi';

interface State {
  isOpen: boolean;
  // Kept separately from photo so the Municipal Archives link works even if the
  // photo itself never loads.
  photoIdentifier: string | null;
  photo: Photo | null;
  products: PrintProductApiResponse[];
  variant: MerchInternalVariant | null;
  quantity: number;
  colorize: boolean;
  errorMessage: string | null;
  isLoading: boolean;
  isCheckingOut: boolean;
  isOrderPlaced: boolean;
}

interface Actions {
  open: (photoIdentifier: string) => void;
  showOrderPlaced: () => void;
  close: () => void;
  setVariant: (variant: MerchInternalVariant) => void;
  setQuantity: (quantity: number) => void;
  setColorize: (colorize: boolean) => void;
  addToCart: () => void;
  checkout: () => Promise<void>;
}

const initialState: State = {
  isOpen: false,
  photoIdentifier: null,
  photo: null,
  products: [],
  variant: null,
  quantity: 1,
  colorize: false,
  errorMessage: null,
  isLoading: false,
  isCheckingOut: false,
  isOrderPlaced: false,
};

// Ignores responses from an earlier open() if the modal has been reopened since.
let latestRequest = 0;

// Left set while the browser is on its way to Stripe, where a slow connection can take
// longer than the timer. The page going away says the redirect worked, so stop the timer.
let backstopTimer: number | undefined;
function clearBackstopTimer(): void {
  if (backstopTimer !== undefined) {
    window.clearTimeout(backstopTimer);
    backstopTimer = undefined;
  }
}
window.addEventListener('pagehide', clearBackstopTimer);

const usePrintCheckoutStore = create(
  immer<State & Actions>((set, get) => ({
    ...initialState,

    open: (photoIdentifier) => {
      const request = ++latestRequest;
      set(() => ({
        ...initialState,
        isOpen: true,
        isLoading: true,
        photoIdentifier,
      }));

      useLoginStore.getState().initialize();

      getPhoto(photoIdentifier)
        .then(async (photo) => {
          // Only 1940s photos can be ordered here. If the product list fails the
          // photo is still kept, so the Municipal Archives link is always shown.
          let products: PrintProductApiResponse[] = [];
          let errorMessage: string | null = null;
          if (photo?.collection === '1940') {
            try {
              products = await getAvailablePrintProducts();
            } catch (err) {
              console.error('Error loading print products', err);
            }
            if (products.length === 0) {
              errorMessage =
                'Prints are not available to order here right now. Please try again later.';
            }
          }
          if (request !== latestRequest) return;
          set((draft) => {
            draft.photo = photo;
            draft.products = products;
            draft.variant = products[0]?.variant ?? null;
            draft.errorMessage = errorMessage;
            draft.isLoading = false;
          });
        })
        .catch((err: unknown) => {
          console.error('Error loading photo', err);
          if (request !== latestRequest) return;
          set((draft) => {
            draft.errorMessage =
              'Something went wrong loading this photo. Please try again later.';
            draft.isLoading = false;
          });
        });
    },

    showOrderPlaced: () => {
      latestRequest++;
      set(() => ({ ...initialState, isOpen: true, isOrderPlaced: true }));
    },

    close: () => {
      latestRequest++;
      set(() => ({ ...initialState }));
    },

    setVariant: (variant) => {
      set((draft) => {
        draft.variant = variant;
      });
    },

    setQuantity: (quantity) => {
      set((draft) => {
        draft.quantity = quantity;
      });
    },

    setColorize: (colorize) => {
      set((draft) => {
        draft.colorize = colorize;
      });
    },

    addToCart: () => {
      const { photo, variant, quantity, colorize } = get();
      if (!photo || !variant) return;
      const added = usePrintCartStore.getState().addItem({
        photoIdentifier: photo.identifier,
        variant,
        quantity,
        colorize,
        label: get().products.find((p) => p.variant === variant)?.label,
      });
      if (!added) {
        set((draft) => {
          draft.errorMessage =
            'Your cart cannot hold any more of this. Check out or remove something first.';
        });
        return;
      }
      recordEvent({ category: 'Prints', action: 'Click Add To Cart' });
      get().close();
    },

    checkout: async () => {
      const { isCheckingOut, photo, variant, quantity, colorize, products } =
        get();
      if (isCheckingOut || !photo || !variant) return;
      const request = latestRequest;

      set((draft) => {
        draft.isCheckingOut = true;
        draft.errorMessage = null;
      });
      try {
        const price = products.find((p) => p.variant === variant)?.priceAmount;
        recordEvent({
          category: 'Prints',
          action: 'Click Checkout',
          value: price ? price * quantity : undefined,
        });

        const base = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
        const url = await createPrintCheckoutSession(
          { photoIdentifier: photo.identifier, variant, quantity, colorize },
          `${base}?noWelcome=&printSuccess=${window.location.hash}`,
          `${base}?noWelcome=${window.location.hash}`
        );
        // Closing the modal while the session is being created would otherwise still send the
        // user to Stripe, so only navigate for the request that opened this checkout.
        if (request !== latestRequest || !get().isOpen) return;

        window.location.href = url;
        // The page is navigating to Stripe, so isCheckingOut stays set to block a second
        // click. If we are still here later the navigation never happened, so let the user
        // try again instead of leaving the button dead.
        backstopTimer = window.setTimeout(() => {
          // A timer left over from an earlier checkout must not report an error into a modal
          // that has been closed and reopened since.
          if (request !== latestRequest || !get().isOpen) return;
          set((draft) => {
            draft.isCheckingOut = false;
            draft.errorMessage = 'Something went wrong. Please try again.';
          });
        }, 5000);
      } catch (error) {
        console.error('Print checkout failed', error);
        // A failure from a modal that has since been closed and reopened must not land in the new
        // one, where it would show an error and re-enable the button mid-retry.
        if (request !== latestRequest || !get().isOpen) return;
        set((draft) => {
          draft.errorMessage = 'Something went wrong. Please try again.';
          draft.isCheckingOut = false;
        });
      }
    },
  }))
);

export default usePrintCheckoutStore;
