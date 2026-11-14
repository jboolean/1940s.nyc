import { MerchOrderState, Order } from 'shared/utils/merch/Order';
import {
  getOrdersForReview,
  getOrdersNeedingAttention,
  getPrintfileUrl,
  updateOrderState,
} from 'shared/utils/merch/merchApi';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface State {
  orders: Order[];
  ordersNeedingAttention: Order[];
  // Orders whose approve or cancel request is in flight.
  pendingOrderIds: number[];
}

interface Actions {
  fulfillOrder(orderId: number): void;
  cancelOrder(orderId: number): void;
  loadOrders(): void;
  loadOrdersNeedingAttention(): void;
  viewPrintfile(itemId: number): void;
}

type Set = (fn: (state: State) => void) => void;

async function updatePendingOrder(
  set: Set,
  orderId: number,
  newState: MerchOrderState
): Promise<void> {
  set((state) => {
    state.pendingOrderIds.push(orderId);
  });
  try {
    await updateOrderState(orderId, newState);
    set((state) => {
      state.orders = state.orders.filter((order) => order.id !== orderId);
    });
  } finally {
    set((state) => {
      state.pendingOrderIds = state.pendingOrderIds.filter(
        (id) => id !== orderId
      );
    });
  }
}

const useReviewMerchStore = create(
  immer<State & Actions>((set) => ({
    orders: [],
    ordersNeedingAttention: [],
    pendingOrderIds: [],
    loadOrders: async () => {
      const orders = await getOrdersForReview();
      set((state) => {
        state.orders = orders;
      });
    },
    loadOrdersNeedingAttention: async () => {
      const orders = await getOrdersNeedingAttention();
      set((state) => {
        state.ordersNeedingAttention = orders;
      });
    },
    fulfillOrder: async (orderId: number) => {
      await updatePendingOrder(
        set,
        orderId,
        MerchOrderState.SUBMITTED_FOR_FULFILLMENT
      );
    },
    cancelOrder: async (orderId: number) => {
      await updatePendingOrder(set, orderId, MerchOrderState.CANCELED);
    },
    viewPrintfile: async (itemId: number) => {
      const url = await getPrintfileUrl(itemId);
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  }))
);

export default useReviewMerchStore;
