import { BadRequest } from 'http-errors';
import { Brackets } from 'typeorm';
import { AppDataSource } from '../../createConnection';
import MerchCustomizationOptions from '../../entities/MerchCustomizationOptions';
import MerchOrder from '../../entities/MerchOrder';
import MerchOrderItem from '../../entities/MerchOrderItem';
import ShippingAddress from '../../entities/ShippingAddress';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import MerchItemState from '../../enum/MerchItemState';
import MerchOrderFulfillmentState from '../../enum/MerchOrderFulfillmentState';
import MerchOrderState from '../../enum/MerchOrderState';
import MerchProvider from '../../enum/MerchProvider';
import EmailService from '../email/EmailService';
import OrderConfirmationTemplate from '../email/templates/OrderConfirmationTemplate';
import OrderCustomizeTemplate from '../email/templates/OrderCustomizeTemplate';
import { OrderTemplateData } from '../email/templates/OrderEmailTemplateData';
import OrderShippedTemplate from '../email/templates/OrderShippedTemplate';
import * as UserService from '../users/UserService';
import { summarizeItems } from '../prodigi/printOrderSummary';
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

export interface NewOrderItem {
  variant: MerchInternalVariant;
  customizationOptions?: MerchCustomizationOptions;
  state?: MerchItemState;
}

// An item that arrives still purchased is one the customer finishes themselves, so the order sends
// the customization email instead of the plain confirmation. Tote bags arrive that way; prints
// arrive fully specified and customized, so a print order gets the confirmation.
function needsCustomization(newItems: NewOrderItem[]): boolean {
  return newItems.some(
    (item) =>
      (item.state ?? MerchItemState.PURCHASED) === MerchItemState.PURCHASED
  );
}

export async function createMerchOrder(
  userId: number,
  stripeCheckoutSessionId: string,
  shippingAddress: ShippingAddress,
  newItems: NewOrderItem[],
  providerShippingMethod?: string
): Promise<MerchOrder> {
  const itemTypes = newItems.map((i) => i.variant);

  // Stripe can deliver the same completed session more than once.
  const existing = await AppDataSource.getRepository(MerchOrder).findOneBy({
    stripeCheckoutSessionId,
  });
  if (existing) {
    console.warn('Order already exists for checkout session', {
      stripeCheckoutSessionId,
      orderId: existing.id,
    });
    return existing;
  }

  const provider = selectProviderForItems(itemTypes);
  const fulfillmentProvider = getFulfillmentProvider(provider);
  const sendsCustomizationEmail = needsCustomization(newItems);

  const created = await AppDataSource.transaction(
    async (transactionalEntityManager) => {
      const orderRepository =
        transactionalEntityManager.getRepository(MerchOrder);
      let order = new MerchOrder();
      order.userId = userId;
      order.state = MerchOrderState.BUILDING;
      order.provider = provider;
      order.stripeCheckoutSessionId = stripeCheckoutSessionId;
      order.providerShippingMethod = providerShippingMethod ?? null;
      order = await orderRepository.save(order);

      const providerOrder = await fulfillmentProvider.createOrder(
        order.id,
        shippingAddress
      );

      order.providerOrderId = providerOrder.providerOrderId;
      if (!providerOrder.providerOrderId) {
        order.shippingAddress = shippingAddress;
      }
      order.state = MerchOrderState.BUILDING;
      order.fulfillmentState = providerOrder.fulfillmentState;

      order = await orderRepository.save(order);

      const itemRepository =
        transactionalEntityManager.getRepository(MerchOrderItem);
      const items = newItems.map((newItem) => {
        const item = new MerchOrderItem();
        item.order = order;
        item.internalVariant = newItem.variant;
        if (newItem.customizationOptions) {
          item.customizationOptions = newItem.customizationOptions;
        }
        if (newItem.state) {
          item.state = newItem.state;
        }
        return item;
      });
      await itemRepository.save(items);

      order = await orderRepository.findOneByOrFail({ id: order.id });

      // The tote bag customization email is how the customer finishes their order, so it stays inside
      // the transaction. Other emails are informational and sent after the commit.
      if (sendsCustomizationEmail) {
        const user = await UserService.getUser(userId);
        if (user.email) {
          // There really should be an email at this point, set earlier in the Stripe webhook
          await EmailService.sendTemplateEmail(
            OrderCustomizeTemplate.createTemplatedEmail({
              to: user.email,
              templateContext: createOrderEmailTemplateData(order),
              metadata: {
                orderId: order.id.toString(),
                userId: user.id.toString(),
              },
            })
          );
        }
      }

      return order;
    }
  );

  if (!sendsCustomizationEmail) {
    try {
      const user = await UserService.getUser(userId);
      if (user.email) {
        await EmailService.sendTemplateEmail(
          OrderConfirmationTemplate.createTemplatedEmail({
            to: user.email,
            templateContext: {
              ...createOrderEmailTemplateData(created),
              itemsSummary: summarizeItems(newItems),
            },
            metadata: {
              orderId: created.id.toString(),
              userId: user.id.toString(),
            },
          })
        );
      }
    } catch (e) {
      // The order is already placed and paid; a missing confirmation must not fail it.
      console.error(
        `Failed to send confirmation email for order ${created.id}`,
        e
      );
    }
  }

  return created;
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

  // Targeted update: a status callback may have changed the order since it was loaded.
  await orderRepository.update(orderId, {
    state: MerchOrderState.SUBMITTED_FOR_FULFILLMENT,
  });
}

export async function cancelOrder(orderId: number): Promise<void> {
  const orderRepository = AppDataSource.getRepository(MerchOrder);
  const order = await orderRepository.findOneByOrFail({ id: orderId });

  const provider = getFulfillmentProvider(order.provider);
  if (
    provider.cancelSubmittedOrder &&
    order.state === MerchOrderState.SUBMITTED_FOR_FULFILLMENT &&
    order.fulfillmentState !== MerchOrderFulfillmentState.CANCELED
  ) {
    try {
      await provider.cancelSubmittedOrder(order);
    } catch (e) {
      console.warn('Provider could not cancel order', orderId, e);
      throw new BadRequest('The printer can no longer cancel this order');
    }
    order.fulfillmentState = MerchOrderFulfillmentState.CANCELED;
  } else if (
    ![
      MerchOrderFulfillmentState.DRAFT,
      MerchOrderFulfillmentState.CANCELED,
      undefined,
    ].includes(order.fulfillmentState ?? undefined)
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

export async function onShipmentSent(
  provider: MerchProvider,
  providerOrderId: string,
  trackingUrl: string
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

  await orderRepository
    .createQueryBuilder()
    .update(MerchOrder)
    .set({ trackingUrl })
    .where({ id: order.id })
    .andWhere('trackingUrl IS DISTINCT FROM :trackingUrl', { trackingUrl })
    .execute();
  order.trackingUrl = trackingUrl;

  const user = await UserService.getUser(order.userId);
  if (!user.email) {
    return;
  }

  // Two callers can report the same shipment at once: the Prodigi callback and the submission poller.
  // Each one locks the order row, writes the tracking link to emailed_tracking_url, and sends only if
  // the column did not already hold that same link. That write is what keeps the two from both
  // sending, and a caller whose send fails clears its own write so a retry can have another go.
  // Delivery is at-least-once: a send the provider accepted but never acknowledged clears the write,
  // and the next retry sends a second copy.
  // Two gaps are accepted here. A crash between the write and the send skips this email for good,
  // since nothing clears a write left behind. And retries only arrive from Prodigi's callbacks and
  // the submission poller, which stops revisiting an order once Prodigi calls it complete.
  const claim = await orderRepository.manager.transaction(async (manager) => {
    // Read under the row lock so the value we put back if the send fails is the one this write
    // replaces, not whatever the order held when it was loaded.
    const rows = await manager.query<
      Array<{ emailed_tracking_url: string | null }>
    >(
      'select emailed_tracking_url from merch_orders where id = $1 for update',
      [order.id]
    );
    const previous = rows[0]?.emailed_tracking_url ?? null;
    if (previous === trackingUrl) {
      return { claimed: false, previous };
    }
    await manager.update(MerchOrder, order.id, {
      emailedTrackingUrl: trackingUrl,
    });
    return { claimed: true, previous };
  });
  if (!claim.claimed) {
    return;
  }

  const orderShippedEmail = OrderShippedTemplate.createTemplatedEmail({
    to: user.email,
    templateContext: createOrderEmailTemplateData(order),
    metadata: {
      orderId: order.id.toString(),
      userId: user.id.toString(),
    },
  });

  try {
    await EmailService.sendTemplateEmail(orderShippedEmail);
  } catch (e) {
    // Nothing went out, so clear the write and let the next retry send it.
    try {
      await orderRepository
        .createQueryBuilder()
        .update(MerchOrder)
        .set({ emailedTrackingUrl: claim.previous })
        .where({ id: order.id })
        .andWhere('emailedTrackingUrl = :trackingUrl', { trackingUrl })
        .execute();
    } catch (releaseError) {
      console.error(
        '[merch] Failed to clear the emailed tracking link',
        releaseError
      );
    }
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
  const repository = AppDataSource.getRepository(MerchOrder);
  const stuckBefore = new Date(Date.now() - 60 * 60 * 1000);

  // Find the orders first, so the returned orders include all of their items.
  const matches = await repository
    .createQueryBuilder('order')
    .leftJoin('order.items', 'items')
    .select('order.id')
    .where('order.state != :canceled', { canceled: MerchOrderState.CANCELED })
    .andWhere(
      new Brackets((qb) =>
        qb
          // Failed or held at the printer
          .where(
            new Brackets((q) =>
              q
                .where({ state: MerchOrderState.SUBMITTED_FOR_FULFILLMENT })
                .andWhere('order.fulfillmentState in (:...states)', {
                  states: [
                    MerchOrderFulfillmentState.FAILED,
                    MerchOrderFulfillmentState.ON_HOLD,
                  ],
                })
            )
          )
          // A print file that could not be created
          .orWhere('items.state = :printfileFailed', {
            printfileFailed: MerchItemState.PRINTFILE_FAILED,
          })
          // A Prodigi order that could not be sent for over an hour
          .orWhere(
            new Brackets((q) =>
              q
                .where('order.provider = :prodigi', {
                  prodigi: MerchProvider.PRODIGI,
                })
                .andWhere('order.state = :pending', {
                  pending: MerchOrderState.PENDING_SUBMISSION,
                })
                .andWhere('order.updatedAt < :stuckBefore', { stuckBefore })
            )
          )
      )
    )
    .getMany();
  if (matches.length === 0) {
    return [];
  }

  return await repository
    .createQueryBuilder('order')
    .leftJoinAndSelect('order.items', 'items')
    .leftJoinAndSelect('order.user', 'user')
    .where('order.id in (:...ids)', { ids: matches.map((o) => o.id) })
    .orderBy('order.createdAt', 'DESC')
    .getMany();
}
