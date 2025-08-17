import api from 'shared/utils/api';
import { MerchCustomizationOptions, MerchOrderState, Order } from './Order';

export async function getMyOrders(): Promise<Order[]> {
  const response = await api.get<Order[]>('/merch/orders');
  return response.data;
}

export async function updateCustomizationOptions(
  itemId: number,
  customizationOptions: MerchCustomizationOptions
): Promise<void> {
  await api.put(
    `/merch/items/${itemId}/customization-options`,
    customizationOptions
  );
}

export async function finalizeCustomization(itemId: number): Promise<void> {
  await api.post(`/merch/items/${itemId}/finalize-customizations`);
}

export async function getOrdersForReview(): Promise<Order[]> {
  const response = await api.get<Order[]>('/merch/orders/for-review');
  return response.data;
}

export async function updateOrderState(
  orderId: number,
  state: MerchOrderState
): Promise<void> {
  await api.patch(`/merch/orders/${orderId}/state`, { state });
}

export async function getOrdersNeedingAttention(): Promise<Order[]> {
  const response = await api.get<Order[]>('/merch/orders/needs-attention');
  return response.data;
}
