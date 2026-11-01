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
import isProduction from '../utils/isProduction';
import { summarizeItems } from './orderSummary';
import type { CreatedProviderOrder } from './providers/FulfillmentProvider';
import getFulfillmentProvider, {
  getProvidersNeedingReview,
  getProvidersWithoutReview,
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
      order.shippingAddress = shippingAddress;
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

  // Claim the order before the printer is called, so a cancel that lands first wins and no order
  // the customer was told is canceled gets printed. Only one submitter can hold the claim.
  // An order left in submitting by a submitter that died mid-call is not retried automatically —
  // the printer may already have it — so it is raised on the admin exceptions page instead.
  const { affected: claimed } = await orderRepository
    .createQueryBuilder()
    .update(MerchOrder)
    .set({ state: MerchOrderState.SUBMITTING })
    .where({ id: orderId, state: MerchOrderState.PENDING_SUBMISSION })
    .execute();
  if (!claimed) {
    console.log('Order was claimed or canceled before submission', orderId);
    return;
  }

  const order = await orderRepository.findOneByOrFail({ id: orderId });

  let providerOrder: CreatedProviderOrder;
  try {
    providerOrder = await getFulfillmentProvider(
      order.provider
    ).submitOrderForFulfillment(order);
  } catch (e) {
    // Nothing was sent, so release the claim and leave the order to be retried.
    await orderRepository
      .createQueryBuilder()
      .update(MerchOrder)
      .set({ state: MerchOrderState.PENDING_SUBMISSION })
      .where({ id: orderId, state: MerchOrderState.SUBMITTING })
      .execute();
    throw e;
  }

  // The printer's id is recorded even if the order has moved on, so its order can still be found.
  if (providerOrder.providerOrderId) {
    await orderRepository.update(orderId, {
      providerOrderId: providerOrder.providerOrderId,
    });
  }

  // Still conditional: a cancel or a callback may have won the race while the printer was being
  // called. A callback that already moved the order on means the submission is recorded anyway.
  const { affected: submitted } = await orderRepository
    .createQueryBuilder()
    .update(MerchOrder)
    .set({ state: MerchOrderState.SUBMITTED_FOR_FULFILLMENT })
    .where({ id: orderId, state: MerchOrderState.SUBMITTING })
    .execute();
  if (!submitted) {
    const settled = await orderRepository.findOneByOrFail({ id: orderId });
    if (settled.state !== MerchOrderState.SUBMITTED_FOR_FULFILLMENT) {
      console.error(
        `[merch-alert] order ${orderId} was ${settled.state} while the printer was creating it; order ${providerOrder.providerOrderId} was created at the printer and needs attention`
      );
    }
  }
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
      [
        MerchOrderState.BUILDING,
        MerchOrderState.PENDING_SUBMISSION,
        MerchOrderState.SUBMITTING,
      ].includes(order.state)
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
    .execute();
  order.trackingUrl = trackingUrl;

  const user = await UserService.getUser(order.userId);
  if (!user.email) {
    return;
  }

  // Two callers can report the same shipment at once: the Prodigi callback and the submission poller.
  // The conditional write to emailed_tracking_url is the claim — whichever caller writes it owns the
  // send — and it doubles as the marker that this shipment has already been emailed about. A caller
  // whose send fails clears its own claim so a retry can have another go.
  // Delivery is at-least-once: a send the provider accepted but never acknowledged clears the claim,
  // and the next retry sends a second copy.
  // Two gaps are accepted here. A crash between the claim and the send skips this email for good,
  // since nothing clears a claim left behind. And retries only arrive from Prodigi's callbacks and
  // the submission poller, which stops revisiting an order once Prodigi calls it complete.
  const { affected } = await orderRepository
    .createQueryBuilder()
    .update(MerchOrder)
    .set({ emailedTrackingUrl: trackingUrl })
    .where({ id: order.id })
    .andWhere('emailedTrackingUrl IS DISTINCT FROM :trackingUrl', {
      trackingUrl,
    })
    .execute();
  if (!affected) {
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
    // Nothing went out, so release the claim and let the next retry send it.
    try {
      await orderRepository
        .createQueryBuilder()
        .update(MerchOrder)
        .set({ emailedTrackingUrl: null })
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
    .andWhere('order.provider in (:...providers)', {
      providers: getProvidersNeedingReview(),
    })
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
          // An order that should have submitted itself and did not, or one whose submitter died
          // after claiming it and before the printer accepted it. Only the providers that submit
          // without review reach pending_submission on their own; the rest wait for a person.
          .orWhere(
            new Brackets((q) =>
              q
                .where('order.provider in (:...noReview)', {
                  noReview: getProvidersWithoutReview(),
                })
                .andWhere('order.state in (:...unstuck)', {
                  unstuck: [
                    MerchOrderState.PENDING_SUBMISSION,
                    MerchOrderState.SUBMITTING,
                  ],
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
