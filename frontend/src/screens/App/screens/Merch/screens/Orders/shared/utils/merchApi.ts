import api from 'shared/utils/api';
import { MerchCustomizationOptions, Order } from './Order';

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
