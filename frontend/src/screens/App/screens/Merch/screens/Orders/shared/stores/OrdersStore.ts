import useLoginStore from 'shared/stores/LoginStore';
import create from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { MerchCustomizationOptions, Order, OrderItem } from '../utils/Order';
import * as merchApi from '../utils/merchApi';

interface State {
  orders: Order[] | null;
  isLoadingOrders: boolean;

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
}

const useOrdersStore = create(
  immer<State & Actions>((set, get) => ({
    orders: null,
    isLoadingOrders: false,
    isLoginOpen: false,
    customizing: null,
    draftCustomizationOptions: null,

    initialize: async () => {
      useLoginStore.getState().initialize();

      set((draft) => {
        draft.isLoadingOrders = true;
        draft.customizing = null;
        draft.isLoginOpen = false;
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
      });
    },
    dismissCustomizing: () => {
      set((draft) => {
        draft.customizing = null;
      });
    },
    setDraftCustomizationOptions: (options: MerchCustomizationOptions) => {
      set((draft) => {
        draft.draftCustomizationOptions = options;
      });
    },
    saveCustomization: async () => {
      const { customizing, draftCustomizationOptions, initialize } = get();
      if (!customizing || !draftCustomizationOptions) {
        throw new Error('No item or customization options to save');
      }
      await merchApi.updateCustomizationOptions(
        customizing.id,
        draftCustomizationOptions
      );
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
