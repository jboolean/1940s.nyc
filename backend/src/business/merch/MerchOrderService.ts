import { BadRequest } from 'http-errors';
import { getConnection, getRepository } from 'typeorm';
import MerchOrder from '../../entities/MerchOrder';
import MerchOrderItem from '../../entities/MerchOrderItem';
import ShippingAddress from '../../entities/ShippingAddress';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import MerchOrderFulfillmentState from '../../enum/MerchOrderFulfillmentState';
import MerchOrderState from '../../enum/MerchOrderState';
import MerchProvider from '../../enum/MerchProvider';
import absurd from '../utils/absurd';
import required from '../utils/required';
import * as PrintfulService from './PrintfulService';

export async function createMerchOrder(
  userId: number,
  stripeCheckoutSessionId: string,
  shippingAddress: ShippingAddress,
  itemTypes: MerchInternalVariant[]
): Promise<MerchOrder> {
  return getConnection().transaction(async (transactionalEntityManager) => {
    const orderRepository =
      transactionalEntityManager.getRepository(MerchOrder);
    let order = new MerchOrder();
    order.userId = userId;
    order.state = MerchOrderState.BUILDING;
    order.provider = MerchProvider.PRINTFUL;
    order.stripeCheckoutSessionId = stripeCheckoutSessionId;
    order = await orderRepository.save(order);

    const printfulOrder = await PrintfulService.createEmptyOrder(
      order.id,
      shippingAddress
    );

    order.providerOrderId = printfulOrder.id;
    order.state = MerchOrderState.BUILDING;
    order.fulfillmentState = MerchOrderFulfillmentState.DRAFT;

    order = await orderRepository.save(order);

    const itemRepository =
      transactionalEntityManager.getRepository(MerchOrderItem);
    const items = itemTypes.map((type) => {
      const item = new MerchOrderItem();
      item.order = order;
      item.internalVariant = type;
      return item;
    });
    await itemRepository.save(items);

    return orderRepository.findOneByOrFail({ id: order.id });
  });
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

  switch (order.provider) {
    case MerchProvider.PRINTFUL:
      await PrintfulService.submitOrderForFulfillment(
        required(order.providerOrderId, 'providerOrderId')
      );
      break;
    default:
      absurd(order.provider);
  }

  order.state = MerchOrderState.SUBMITTED_FOR_FULFILLMENT;
  await orderRepository.save(order);
}

export async function cancelOrder(orderId: number): Promise<void> {
  const orderRepository = getRepository(MerchOrder);
  const order = await orderRepository.findOneByOrFail({ id: orderId });

  if (
    ![
      MerchOrderFulfillmentState.DRAFT,
      MerchOrderFulfillmentState.CANCELED,
      undefined,
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

export async function onPrinterStatusChanged(
  provider: MerchProvider,
  providerOrderId: number,
  newFulfillmentState: MerchOrderFulfillmentState
): Promise<void> {
  const orderRepository = getRepository(MerchOrder);
  const order = await orderRepository.findOneBy({
    provider,
    providerOrderId,
  });

  if (!order) {
    console.warn(`Order with providerOrderId ${providerOrderId} not found`);
    return;
  }

  if (newFulfillmentState !== order.fulfillmentState) {
    console.log(
      'Order fulfillment state transition',
      order.state,
      '->',
      newFulfillmentState
    );
    order.fulfillmentState = newFulfillmentState;

    // If needed, update the order state based on the fulfillment state
    // Generally the order state is updated directly by this app, but if actions are taken directly in the printer, we need to update the state here
    if (
      [MerchOrderState.BUILDING, MerchOrderState.PENDING_SUBMISSION].includes(
        order.state
      )
    ) {
      if (newFulfillmentState === MerchOrderFulfillmentState.CANCELED) {
        order.state = MerchOrderState.CANCELED;
      } else if (newFulfillmentState !== MerchOrderFulfillmentState.DRAFT) {
        // Any state besides draft means it was submitted for fulfillment
        order.state = MerchOrderState.SUBMITTED_FOR_FULFILLMENT;
      }
    }
    await orderRepository.save(order);
  }
}

export async function onShipmentSent(
  provider: MerchProvider,
  providerOrderId: number,
  trackingUrl: string
): Promise<void> {
  const orderRepository = getRepository(MerchOrder);
  const order = await orderRepository.findOneBy({
    provider,
    providerOrderId,
  });

  if (!order) {
    console.warn(`Order with providerOrderId ${providerOrderId} not found`);
    return;
  }

  order.trackingUrl = trackingUrl;
  await orderRepository.save(order);
}
