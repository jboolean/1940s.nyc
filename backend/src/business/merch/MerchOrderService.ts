import { BadRequest } from 'http-errors';
import { AppDataSource } from '../../createConnection';
import MerchOrder from '../../entities/MerchOrder';
import MerchOrderItem from '../../entities/MerchOrderItem';
import ShippingAddress from '../../entities/ShippingAddress';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import MerchOrderFulfillmentState from '../../enum/MerchOrderFulfillmentState';
import MerchOrderState from '../../enum/MerchOrderState';
import MerchProvider from '../../enum/MerchProvider';
import EmailService from '../email/EmailService';
import OrderCustomizeTemplate from '../email/templates/OrderCustomizeTemplate';
import { OrderTemplateData } from '../email/templates/OrderEmailTemplateData';
import OrderShippedTemplate from '../email/templates/OrderShippedTemplate';
import * as UserService from '../users/UserService';
import absurd from '../utils/absurd';
import isProduction from '../utils/isProduction';
import required from '../utils/required';
import * as PrintfulService from './PrintfulService';

const API_BASE = isProduction()
  ? 'http://api.1940s.nyc'
  : 'http://dev.1940s.nyc:3000';

function createOrderEmailTemplateData(order: MerchOrder): OrderTemplateData {
  return {
    orderId: order.id.toString(),
    ordersUrl: UserService.createMagicLinkUrl(
      API_BASE,
      order.userId,
      '/orders'
    ).toString(),
    trackingUrl: order.trackingUrl ?? undefined,
  };
}

export async function createMerchOrder(
  userId: number,
  stripeCheckoutSessionId: string,
  shippingAddress: ShippingAddress,
  itemTypes: MerchInternalVariant[]
): Promise<MerchOrder> {
  return AppDataSource.transaction(async (transactionalEntityManager) => {
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

    order = await orderRepository.findOneByOrFail({ id: order.id });

    const user = await UserService.getUser(userId);

    if (user.email) {
      // There really should be an email at this point, set earlier in the Stripe webhook

      const orderCustomizeEmail = OrderCustomizeTemplate.createTemplatedEmail({
        to: user.email,
        templateContext: createOrderEmailTemplateData(order),
        metadata: {
          orderId: order.id.toString(),
          userId: user.id.toString(),
        },
      });

      await EmailService.sendTemplateEmail(orderCustomizeEmail);
    }

    return order;
  });
}

export async function createOrderItems(
  order: MerchOrder,
  itemTypes: MerchInternalVariant[]
): Promise<MerchOrderItem[]> {
  const itemRepository = AppDataSource.getRepository(MerchOrderItem);
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
  const orderRepository = AppDataSource.getRepository(MerchOrder);
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
  const orderRepository = AppDataSource.getRepository(MerchOrder);
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
  const orderRepository = AppDataSource.getRepository(MerchOrder);
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
  const orderRepository = AppDataSource.getRepository(MerchOrder);
  let order = await orderRepository.findOneBy({
    provider,
    providerOrderId,
  });

  if (!order) {
    console.warn(`Order with providerOrderId ${providerOrderId} not found`);
    return;
  }

  order.trackingUrl = trackingUrl;
  order = await orderRepository.save(order);

  const user = await UserService.getUser(order.userId);

  if (user.email) {
    const orderShippedEmail = OrderShippedTemplate.createTemplatedEmail({
      to: user.email,
      templateContext: createOrderEmailTemplateData(order),
      metadata: {
        orderId: order.id.toString(),
        userId: user.id.toString(),
      },
    });

    await EmailService.sendTemplateEmail(orderShippedEmail);
  }
}

export async function getOrdersForReview(): Promise<MerchOrder[]> {
  return AppDataSource.getRepository(MerchOrder)
    .createQueryBuilder('order')
    .innerJoinAndSelect('order.items', 'items')
    .innerJoinAndSelect('order.user', 'user')
    .where({ state: MerchOrderState.PENDING_SUBMISSION })
    .orderBy('order.createdAt', 'DESC')
    .getMany();
}

export async function getOrdersWithExceptions(): Promise<MerchOrder[]> {
  return await AppDataSource.getRepository(MerchOrder)
    .createQueryBuilder('order')
    .innerJoinAndSelect('order.items', 'items')
    .innerJoinAndSelect('order.user', 'user')
    .where({ state: MerchOrderState.SUBMITTED_FOR_FULFILLMENT })
    .andWhere('order.fulfillmentState in (:...states)', {
      states: [
        MerchOrderFulfillmentState.FAILED,
        MerchOrderFulfillmentState.ON_HOLD,
      ],
    })
    .orderBy('order.createdAt', 'DESC')
    .getMany();
}
