import MerchOrderItem from '../../entities/MerchOrderItem';
import ShippingAddress from '../../entities/ShippingAddress';
import {
  confirmOrder,
  createItemByOrderId,
  createOrder,
  deleteItemById,
  getItemById,
  getItemsByOrderId,
  Order as PrintfulOrder,
  Address as PrintfulRecipient,
} from '../utils/printfulApi';
import required from '../utils/required';
import { makePrintfulItem } from './PrintfulItemBuildService';

type PrintfulItem = { id: number; placements?: Array<{ placement: string }> };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Printful populates `placements` asynchronously after item creation, so it
// can briefly come back empty right after createItemByOrderId returns. Poll
// a few times before giving up instead of failing on the first check.
const PLACEMENT_POLL_DELAYS_MS = [1000, 2000, 4000];

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

  const createdResp = await createItemByOrderId({
    path: {
      order_id: printfulOrderId,
    },
    body: makePrintfulItem(item.id, item.internalVariant),
  });

  if (createdResp.error) {
    throw new Error(
      `Printful API returned error creating item ${
        item.id
      } in order ${printfulOrderId}: ${JSON.stringify(createdResp.error)}`
    );
  }

  // createdResp.data is { data: Item, _links }. The generated type claims
  // `data` is an array (it shares a response schema with the list-items
  // endpoint), but a create call actually returns the single created item
  // as an object - confirmed against the real API response.
  let createdItem = createdResp.data?.data as unknown as PrintfulItem;

  for (const delayMs of PLACEMENT_POLL_DELAYS_MS) {
    if (createdItem?.placements?.length) break;
    await sleep(delayMs);
    const refetched = await getItemById({
      path: {
        order_id: printfulOrderId,
        order_item_id: createdItem.id,
      },
    });
    createdItem = refetched.data?.data as unknown as PrintfulItem;
  }

  if (!createdItem?.placements?.length) {
    throw new Error(
      `Printful created item ${item.id} in order ${printfulOrderId} but the placement was empty/not set. This means the printfile image could not be fetched. Refusing to continue.`
    );
  }
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
