import MerchOrderItem from '../../entities/MerchOrderItem';
import ShippingAddress from '../../entities/ShippingAddress';
import {
  confirmOrder,
  createItemByOrderId,
  createOrder,
  deleteItemById,
  getItemsByOrderId,
  Order as PrintfulOrder,
  Address as PrintfulRecipient,
} from '../utils/printfulApi';
import required from '../utils/required';
import { makePrintfulItem } from './PrintfulItemBuildService';

function toPrintfulRecipient(address: ShippingAddress): PrintfulRecipient {
  return {
    name: address.name,
    address1: address.line1,
    address2: address.line2,
    city: address.city,
    state_code: address.stateCode,
    country_code: address.countryCode,
    zip: address.postalCode,
  };
}

export async function createEmptyOrder(
  merchOrderId: number,
  shippingAddress: ShippingAddress
): Promise<PrintfulOrder> {
  const orderResp = await createOrder({
    body: {
      recipient: toPrintfulRecipient(shippingAddress),
      external_id: merchOrderId.toString(),
      order_items: [],
    },
  });

  const printfulOrder = orderResp.data?.data;
  if (!printfulOrder) {
    throw new Error('Failed to create order' + JSON.stringify(orderResp));
  }
  return printfulOrder;
}

export async function addItemToOrder(item: MerchOrderItem): Promise<void> {
  const printfulOrderId = required(
    item.order.providerOrderId,
    'item.order.printfulOrderId'
  );

  // Idempotency
  const itemsResp = await getItemsByOrderId({
    path: {
      order_id: printfulOrderId,
    },
  });
  const existingItem = itemsResp.data?.data.find(
    (i) => i.external_id === item.id.toString()
  );
  if (existingItem) {
    console.warn('Item already exists in order. Deleting.', item.id);
    await deleteItemById({
      path: {
        order_id: printfulOrderId,
        order_item_id: existingItem.id,
      },
    });
  }

  await createItemByOrderId({
    path: {
      order_id: printfulOrderId,
    },
    body: await makePrintfulItem(item.id, item.internalVariant),
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
