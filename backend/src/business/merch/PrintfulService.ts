import MerchOrderItem from '../../entities/MerchOrderItem';
import ShippingAddress from '../../entities/ShippingAddress';
import {
  confirmOrder,
  createItemByOrderId,
  createOrder,
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

  return required(orderResp.data?.data, 'orderResp.data.data');
}

export async function addItemToOrder(item: MerchOrderItem): Promise<void> {
  const printfulOrderId = required(
    item.order.printfulOrderId,
    'item.order.printfulOrderId'
  );
  await createItemByOrderId({
    path: {
      order_id: printfulOrderId,
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
