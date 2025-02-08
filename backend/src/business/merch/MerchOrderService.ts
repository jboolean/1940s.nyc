import { getRepository } from 'typeorm';
import MerchOrder from '../../entities/MerchOrder';
import MerchOrderItem from '../../entities/MerchOrderItem';
import ShippingAddress from '../../entities/ShippingAddress';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import * as PrintfulService from './PrintfulService';

export async function createEmptyMerchOrder(
  stripeCheckoutSessionId: string,
  shippingAddress: ShippingAddress
): Promise<MerchOrder> {
  const orderRepository = getRepository(MerchOrder);
  let order = new MerchOrder();
  order.stripeCheckoutSessionId = stripeCheckoutSessionId;
  console.log('Saving new order!');
  order = await orderRepository.save(order);
  console.log('Saved new order');

  const printfulOrder = await PrintfulService.createEmptyOrder(
    order.id,
    shippingAddress
  );

  order.printfulOrderId = printfulOrder.id;

  order = await orderRepository.save(order);

  console.log('updated order with printful id', printfulOrder.id);

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
