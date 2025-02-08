import MerchOrderItem from '../../entities/MerchOrderItem';
import {
  confirmOrder,
  createItemByOrderId,
  createOrder,
  Order as PrintfulOrder,
  Address as PrintfulRecipient,
} from '../utils/printfulApi';
import required from '../utils/required';
import { makePrintfulItem } from './PrintfulItemBuildService';

export async function createEmptyOrder(
  merchOrderId: number,
  shippingAddress: PrintfulRecipient
): Promise<PrintfulOrder> {
  const orderResp = await createOrder({
    body: {
      recipient: shippingAddress,
      external_id: merchOrderId.toString(),
      order_items: [],
    },
  });

  return required(orderResp.data?.data, 'orderResp.data.data');
}

export async function addItemToOrder(item: MerchOrderItem): Promise<void> {
  await createItemByOrderId({
    path: {
      order_id: item.order.printfulOrderId,
    },
    body: makePrintfulItem(item.id, item.internalVariant),
  });
}

export async function submitOrderForFulfillment(
  printfulOrderId: number
): Promise<void> {
  await confirmOrder({
    path: {
      order_id: printfulOrderId,
    },
  });
}
