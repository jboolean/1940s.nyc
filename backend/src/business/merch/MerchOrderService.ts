import { BadRequest } from 'http-errors';
import { IsNull } from 'typeorm';
import { AppDataSource } from '../../createConnection';
import MerchOrder from '../../entities/MerchOrder';
import MerchOrderItem from '../../entities/MerchOrderItem';
import MerchShipment from '../../entities/MerchShipment';
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
import isProduction from '../utils/isProduction';
import getFulfillmentProvider, {
  selectProviderForItems,
} from './providers/getFulfillmentProvider';

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
    const provider = selectProviderForItems(itemTypes);
    order.provider = provider;
    order.stripeCheckoutSessionId = stripeCheckoutSessionId;
    order = await orderRepository.save(order);

    const providerOrder = await getFulfillmentProvider(provider).createOrder(
      order.id,
      shippingAddress
    );

    order.providerOrderId = providerOrder.providerOrderId;
    order.state = MerchOrderState.BUILDING;
    order.fulfillmentState = providerOrder.fulfillmentState;

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

  await getFulfillmentProvider(order.provider).submitOrderForFulfillment(order);

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
  providerOrderId: string,
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

export interface ShipmentInfo {
  providerShipmentId: string;
  trackingUrl?: string;
  trackingNumber?: string;
  carrier?: string;
}

export async function onShipmentSent(
  provider: MerchProvider,
  providerOrderId: string,
  shipmentInfo: ShipmentInfo
): Promise<void> {
  const orderRepository = AppDataSource.getRepository(MerchOrder);
  const shipmentRepository = AppDataSource.getRepository(MerchShipment);
  const order = await orderRepository.findOneBy({
    provider,
    providerOrderId,
  });

  if (!order) {
    console.warn(`Order with providerOrderId ${providerOrderId} not found`);
    return;
  }

  // Upsert so concurrent or retried deliveries of the same shipment converge on one row.
  await shipmentRepository.upsert(
    {
      orderId: order.id,
      providerShipmentId: shipmentInfo.providerShipmentId,
      trackingUrl: shipmentInfo.trackingUrl ?? null,
      trackingNumber: shipmentInfo.trackingNumber ?? null,
      carrier: shipmentInfo.carrier ?? null,
    },
    ['orderId', 'providerShipmentId']
  );
  const shipment = await shipmentRepository.findOneByOrFail({
    orderId: order.id,
    providerShipmentId: shipmentInfo.providerShipmentId,
  });

  // order.trackingUrl follows the most recently created shipment, so a retry of an older one cannot move it back.
  const latest = await shipmentRepository.findOne({
    where: { orderId: order.id },
    order: { id: 'DESC' },
  });
  if (latest?.trackingUrl && latest.trackingUrl !== order.trackingUrl) {
    order.trackingUrl = latest.trackingUrl;
    await orderRepository.save(order);
  }

  // Claim the email atomically so exactly one delivery sends it; release the claim if sending fails so a retry sends it.
  const claim = await shipmentRepository.update(
    { id: shipment.id, emailedAt: IsNull() },
    { emailedAt: new Date() }
  );
  if (!claim.affected) {
    return;
  }

  try {
    const user = await UserService.getUser(order.userId);
    if (user.email) {
      const orderShippedEmail = OrderShippedTemplate.createTemplatedEmail({
        to: user.email,
        templateContext: {
          ...createOrderEmailTemplateData(order),
          trackingUrl: shipment.trackingUrl ?? undefined,
        },
        metadata: {
          orderId: order.id.toString(),
          userId: user.id.toString(),
        },
      });

      await EmailService.sendTemplateEmail(orderShippedEmail);
    }
  } catch (e) {
    await shipmentRepository.update({ id: shipment.id }, { emailedAt: null });
    throw e;
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
