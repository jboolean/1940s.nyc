import { getRepository } from 'typeorm';
import MerchOrder from '../../entities/MerchOrder';
import MerchOrderItem from '../../entities/MerchOrderItem';
import ShippingAddress from '../../entities/ShippingAddress';
import PrintfulOrderStatus from '../../third-party/printful/PrintfulOrderStatus';
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
import PrintfulToMerchOrderStatusMap from './PrintfulToMerchOrderStatusMap';

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
    return;
  }

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

export async function updateLocalStatus(
  printfulOrderId: number,
  printfulOrderStatus: PrintfulOrderStatus
): Promise<void> {
  const orderRepository = getRepository(MerchOrder);
  const order = await orderRepository.findOneBy({
    printfulOrderId,
  });

  if (!order) {
    console.warn(`Order with printfulOrderId ${printfulOrderId} not found`);
    return;
  }

  const newState = PrintfulToMerchOrderStatusMap[printfulOrderStatus];
  if (newState !== order.fulfillmentState) {
    console.log(
      'Order fulfillment state transition',
      order.state,
      '->',
      newState
    );
    order.fulfillmentState = newState;
    await orderRepository.save(order);
  }
}
