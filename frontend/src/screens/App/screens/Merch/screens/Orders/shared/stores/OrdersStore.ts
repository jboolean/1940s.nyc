import useLoginStore from 'shared/stores/LoginStore';
import {
  MerchCustomizationOptions,
  Order,
  OrderItem,
} from 'shared/utils/merch/Order';
import * as merchApi from 'shared/utils/merch/merchApi';
import create from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface State {
  orders: Order[] | null;
  isSavingCustomization: boolean;
  isLoadingOrders: boolean;
  step: 'front' | 'back';

  isLoginOpen: boolean;
  customizing: OrderItem | null;
  draftCustomizationOptions: MerchCustomizationOptions | null;
}

interface ComputedState {}

interface Actions {
  initialize: () => Promise<void>;
  openLogin: () => void;
  closeLogin: () => void;
  openItemForCustomizing: (item: OrderItem) => void;
  dismissCustomizing: () => void;
  setDraftCustomizationOptions: (options: MerchCustomizationOptions) => void;
  saveCustomization: () => Promise<void>;
  submitForPrinting: () => Promise<void>;
  goToOtherSideOfBag: () => void;
}

const useOrdersStore = create(
  immer<State & Actions>((set, get) => ({
    orders: null,
    isSavingCustomization: false,
    isLoadingOrders: false,
    isLoginOpen: false,
    customizing: null,
    draftCustomizationOptions: null,
    step: 'back',

    initialize: async () => {
      useLoginStore.getState().initialize();

      set((draft) => {
        draft.isLoadingOrders = true;
        draft.customizing = null;
        draft.isLoginOpen = false;
        draft.step = 'back';
      });

      // const orders = await api.getOrders();
      const orders: Order[] = await merchApi.getMyOrders();
      set((draft) => {
        draft.orders = orders;
        draft.isLoadingOrders = false;
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
    openItemForCustomizing: (item: OrderItem) => {
      set((draft) => {
        draft.customizing = item;
        draft.draftCustomizationOptions = item.customizationOptions;
        draft.step = 'back';
      });
    },
    dismissCustomizing: () => {
      set((draft) => {
        draft.customizing = null;
      });
    },
    goToOtherSideOfBag: () => {
      set((draft) => {
        draft.step = draft.step === 'front' ? 'back' : 'front';
      });
    },
    setDraftCustomizationOptions: (options: MerchCustomizationOptions) => {
      set((draft) => {
        draft.draftCustomizationOptions = options;
      });
    },
    saveCustomization: async () => {
      const { customizing, draftCustomizationOptions } = get();
      if (!customizing || !draftCustomizationOptions) {
        throw new Error('No item or customization options to save');
      }
      set((draft) => {
        draft.isSavingCustomization = true;
      });
      await merchApi
        .updateCustomizationOptions(customizing.id, draftCustomizationOptions)
        .finally(() => {
          set((draft) => {
            draft.isSavingCustomization = false;
          });
        });
    },
    submitForPrinting: async () => {
      const { customizing, draftCustomizationOptions, initialize } = get();
      if (!customizing || !draftCustomizationOptions) {
        throw new Error('No item or customization options to save');
      }

      const confirmedFinalize = confirm(
        'Are you sure want to send for printing? Once sent, it cannot be changed.'
      );
      if (!confirmedFinalize) {
        return;
      }
      await merchApi.finalizeCustomization(customizing.id);

      await initialize();
    },
  }))
);

export function useOrdersStoreComputeds(): ComputedState {
  return {};
}

export default useOrdersStore;
