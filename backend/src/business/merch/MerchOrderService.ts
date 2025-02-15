import { getRepository } from 'typeorm';
import MerchOrder from '../../entities/MerchOrder';
import MerchOrderItem from '../../entities/MerchOrderItem';
import ShippingAddress from '../../entities/ShippingAddress';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import MerchOrderFulfillmentState from '../../enum/MerchOrderFulfillmentState';
import MerchOrderState from '../../enum/MerchOrderState';
import * as PrintfulService from './PrintfulService';

export async function createEmptyMerchOrder(
  stripeCheckoutSessionId: string,
  shippingAddress: ShippingAddress
): Promise<MerchOrder> {
  const orderRepository = getRepository(MerchOrder);
  let order = new MerchOrder();
  order.state = MerchOrderState.BUILDING;
  order.stripeCheckoutSessionId = stripeCheckoutSessionId;
  order = await orderRepository.save(order);

  const printfulOrder = await PrintfulService.createEmptyOrder(
    order.id,
    shippingAddress
  );

  order.printfulOrderId = printfulOrder.id;
  order.state = MerchOrderState.SUBMITTED_FOR_FULFILLMENT;
  order.fulfillmentState = MerchOrderFulfillmentState.DRAFT;

  order = await orderRepository.save(order);

  return order;
}

export async function createOrderItems(
  order: MerchOrder,
  itemTypes: MerchInternalVariant[]
): Promise<MerchOrderItem[]> {
  const itemRepository = getRepository(MerchOrderItem);
  const items = itemTypes.map((type) => {
    const item = new MerchOrderItem();
    item.order = order;
    item.internalVariant = type;
    return item;
  });
  return await itemRepository.save(items);
}
