import { getPrintfileUrl } from '../../business/merch/PrintfulItemBuildService';
import MerchOrder from '../../entities/MerchOrder';
import MerchOrderItem from '../../entities/MerchOrderItem';
import { MerchOrderApiModel, MerchOrderItemApiModel } from './AdminMerchOrder';

export function orderItemToApi(item: MerchOrderItem): MerchOrderItemApiModel {
  return {
    id: item.id,
    internalVariant: item.internalVariant,
    customizationOptions: item.customizationOptions ?? undefined,
    state: item.state,
    printfileUrl: getPrintfileUrl(item.id),
  };
}

export function orderToApi(order: MerchOrder): MerchOrderApiModel {
  return {
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    userId: order.userId,
    email: order.user.email ?? undefined,
    state: order.state,
    items: order.items.map(orderItemToApi),
    trackingUrl: order.trackingUrl ?? undefined,
  };
}
