import { MerchOrderState, Order } from 'shared/utils/merch/Order';
import {
  getOrdersForReview,
  getOrdersNeedingAttention,
  getPrintfileUrl,
  updateOrderState,
} from 'shared/utils/merch/merchApi';
import create from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface State {
  orders: Order[];
  ordersNeedingAttention: Order[];
}

interface Actions {
  fulfillOrder(orderId: number): void;
  cancelOrder(orderId: number): void;
  loadOrders(): void;
  loadOrdersNeedingAttention(): void;
  viewPrintfile(itemId: number): void;
}

const useReviewMerchStore = create(
  immer<State & Actions>((set) => ({
    orders: [],
    ordersNeedingAttention: [],
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
      await updateOrderState(
        orderId,
        MerchOrderState.SUBMITTED_FOR_FULFILLMENT
      );
      set((state) => {
        state.orders = state.orders.filter((order) => order.id !== orderId);
      });
    },
    cancelOrder: async (orderId: number) => {
      await updateOrderState(orderId, MerchOrderState.CANCELED);
      set((state) => {
        state.orders = state.orders.filter((order) => order.id !== orderId);
      });
    },
    viewPrintfile: async (itemId: number) => {
      const url = await getPrintfileUrl(itemId);
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  }))
);

export default useReviewMerchStore;
