import MerchOrder from '../../entities/MerchOrder';
import MerchOrderItem from '../../entities/MerchOrderItem';
import { MerchOrderApiModel, MerchOrderItemApiModel } from './OrderApiModel';

export function orderItemToApi(item: MerchOrderItem): MerchOrderItemApiModel {
  return {
    id: item.id,
    internalVariant: item.internalVariant,
    customizationOptions: item.customizationOptions ?? undefined,
    state: item.state,
  };
}

export function orderToApi(order: MerchOrder): MerchOrderApiModel {
  return {
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    userId: order.userId,
    email: order.user.email ?? undefined,
    state: order.state,
    fulfillmentState: order.fulfillmentState,
    items: order.items.map(orderItemToApi),
    trackingUrl: order.trackingUrl ?? undefined,
  };
}
