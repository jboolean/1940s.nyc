import { BadRequest } from 'http-errors';
import { getRepository } from 'typeorm';
import MerchOrder from '../../entities/MerchOrder';
import MerchOrderItem from '../../entities/MerchOrderItem';
import ShippingAddress from '../../entities/ShippingAddress';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import MerchOrderFulfillmentState from '../../enum/MerchOrderFulfillmentState';
import MerchOrderState from '../../enum/MerchOrderState';
import required from '../utils/required';
import * as PrintfulService from './PrintfulService';

export async function createEmptyMerchOrder(
  userId: number,
  stripeCheckoutSessionId: string,
  shippingAddress: ShippingAddress
): Promise<MerchOrder> {
  const orderRepository = getRepository(MerchOrder);
  let order = new MerchOrder();
  order.userId = userId;
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

export async function submitOrderForFulfillment(
  orderId: number
): Promise<void> {
  const orderRepository = getRepository(MerchOrder);
  const order = await orderRepository.findOneByOrFail({ id: orderId });

  await PrintfulService.submitOrderForFulfillment(
    required(order.printfulOrderId, 'printfulOrderId')
  );

  order.state = MerchOrderState.SUBMITTED_FOR_FULFILLMENT;
  await orderRepository.save(order);
}

export async function cancelOrder(orderId: number): Promise<void> {
  const orderRepository = getRepository(MerchOrder);
  const order = await orderRepository.findOneByOrFail({ id: orderId });

  if (
    [
      MerchOrderFulfillmentState.DRAFT,
      MerchOrderFulfillmentState.CANCELED,
      null,
    ].includes(order.fulfillmentState)
  ) {
    // In the future we could support canceling in Printful here.
    // Printful has not built canceling into their v2 API yet.
    throw new BadRequest('Cannot cancel order that is already submitted');
  }
  // TODO does this need to refund?
  order.state = MerchOrderState.CANCELED;
  await orderRepository.save(order);
}
