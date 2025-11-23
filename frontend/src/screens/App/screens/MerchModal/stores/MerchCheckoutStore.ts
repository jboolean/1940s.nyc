import { MerchInternalVariant } from 'shared/utils/merch/Order';
import recordEvent from 'shared/utils/recordEvent';
import create from 'zustand';
import { immer } from 'zustand/middleware/immer';
import useLoginStore from '../../../../../shared/stores/LoginStore';
import {
  getAvailableProducts,
  MerchProductApiResponse,
  redirectToCheckout,
} from '../utils/MerchCheckoutApi';

interface State {
  isOpen: boolean;
  availableProducts: MerchProductApiResponse[] | null;
  productQuantities: Record<MerchInternalVariant, number>;
  errorMessage: string | null;
  isCheckingOut: boolean;
  isLoadingProducts: boolean;
}

interface Actions {
  open: () => void;
  close: () => void;
  setQuantity: (variant: MerchInternalVariant, quantity: number) => void;
  handleCheckout: () => void;
}

interface ComputedState {
  isCheckoutDisabled: boolean;
}

const useMerchCheckoutStore = create(
  immer<State & Actions>((set, get) => ({
    isOpen: false,
    availableProducts: null,
    productQuantities: {} as Record<MerchInternalVariant, number>,
    errorMessage: null,
    isCheckingOut: false,
    isLoadingProducts: false,
    open: () => {
      set((draft) => {
        draft.isOpen = true;
        draft.errorMessage = null;
        draft.isLoadingProducts = true;
      });

      useLoginStore.getState().initialize();

      getAvailableProducts()
        .then((products) => {
          set((draft) => {
            draft.availableProducts = products;
            draft.isLoadingProducts = false;
            // Initialize quantities to 1 for all products
            products.forEach((product) => {
              draft.productQuantities[product.variant] = 1;
            });
          });
        })
        .catch((err: unknown) => {
          set((draft) => {
            console.error('Error fetching products', err);
            draft.errorMessage =
              'Something went wrong loading products. Please try again later.';
            draft.isLoadingProducts = false;
          });
        });
    },

    close: () => {
      set((draft) => {
        draft.isOpen = false;
        draft.errorMessage = null;
      });
    },

    setQuantity: (variant: MerchInternalVariant, quantity: number) => {
      set((draft) => {
        draft.productQuantities[variant] = quantity;
      });
    },

    handleCheckout: async () => {
      try {
        set((draft) => {
          draft.isCheckingOut = true;
          draft.errorMessage = null;
        });

        const { productQuantities, availableProducts } = get();
        if (!availableProducts) {
          set((draft) => {
            draft.errorMessage = 'Products not loaded';
            draft.isCheckingOut = false;
          });
          return;
        }

        const items = availableProducts
          .filter((product) => productQuantities[product.variant] > 0)
          .map((product) => ({
            variant: product.variant,
            quantity: productQuantities[product.variant],
          }));

        if (items.length === 0) {
          set((draft) => {
            draft.errorMessage = 'Please select at least one item';
            draft.isCheckingOut = false;
          });
          return;
        }

        const totalAmountMinorUnits = items.reduce((total, item) => {
          const product = availableProducts.find(
            (p) => p.variant === item.variant
          );
          return total + (product?.priceAmount ?? 0) * item.quantity;
        }, 0);

        recordEvent({
          category: 'Merch',
          action: 'Click Checkout',
          value: totalAmountMinorUnits,
        });

        const successUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?noWelcome=&tipSuccess=${window.location.hash}`;
        const cancelUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?noWelcome=&openMerch=${window.location.hash}`;

        await redirectToCheckout(items, successUrl, cancelUrl);
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

export function useMerchCheckoutStoreComputeds(): ComputedState {
  const {
    isCheckingOut,
    isLoadingProducts,
    availableProducts,
    productQuantities,
  } = useMerchCheckoutStore();

  const hasNoQuantities =
    !availableProducts ||
    availableProducts.every(
      (product) => (productQuantities[product.variant] ?? 0) === 0
    );

  return {
    isCheckoutDisabled: isCheckingOut || isLoadingProducts || hasNoQuantities,
  };
}

export default useMerchCheckoutStore;
