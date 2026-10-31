import { In } from 'typeorm';
import * as MerchOrderService from '../business/merch/MerchOrderService';
import { applyProdigiOrder } from '../business/prodigi/ProdigiCallbackService';
import * as ProdigiService from '../business/prodigi/ProdigiService';
import { AppDataSource } from '../createConnection';
import MerchOrder from '../entities/MerchOrder';
import MerchOrderFulfillmentState from '../enum/MerchOrderFulfillmentState';
import MerchOrderState from '../enum/MerchOrderState';
import MerchProvider from '../enum/MerchProvider';

const LIMIT = 5;

/**
 * Prodigi orders are fulfilled the moment they are created, so unlike tote bags they are not held
 * for review: once every print file is ready they are sent automatically. A failure leaves the order in
 * pending_submission (where the merch review queue shows it) and is retried on the next run. The
 * idempotency key on the Prodigi order makes a retry after a partial failure safe.
 */
export async function submitPendingProdigiOrders(): Promise<void> {
  const orders = await AppDataSource.getRepository(MerchOrder).find({
    where: {
      provider: MerchProvider.PRODIGI,
      state: MerchOrderState.PENDING_SUBMISSION,
    },
    order: { updatedAt: 'ASC' },
    take: LIMIT,
  });

  for (const order of orders) {
    try {
      console.log('[prodigi] Submitting order', order.id);
      await MerchOrderService.submitOrderForFulfillment(order.id);
    } catch (e) {
      console.error(`[prodigi] Failed to submit order ${order.id}`, e);
    }
  }
}

/**
 * Polls Prodigi for submitted orders. Callbacks normally keep orders current; this covers lost
 * callbacks, orders held in Prodigi's edit window, and environments Prodigi cannot reach.
 */
export async function syncSubmittedProdigiOrders(): Promise<void> {
  const repository = AppDataSource.getRepository(MerchOrder);
  const orders = await repository
    .createQueryBuilder('order')
    .where({
      provider: MerchProvider.PRODIGI,
      state: In([MerchOrderState.SUBMITTED_FOR_FULFILLMENT]),
    })
    .andWhere('order.provider_order_id is not null')
    .andWhere(
      '(order.fulfillment_state is null or order.fulfillment_state not in (:...done))',
      {
        done: [
          MerchOrderFulfillmentState.FULFILLED,
          MerchOrderFulfillmentState.CANCELED,
        ],
      }
    )
    .orderBy('order.updatedAt', 'ASC')
    .limit(20)
    .getMany();

  for (const order of orders) {
    const providerOrderId = order.providerOrderId as string;
    try {
      const prodigiOrder = await ProdigiService.getOrder(providerOrderId);
      if (prodigiOrder) {
        await applyProdigiOrder(providerOrderId, prodigiOrder);
      }
      // Touch the row so orders are visited in turn.
      await repository.update(order.id, { updatedAt: new Date() });
    } catch (e) {
      console.error(`[prodigi] Failed to sync order ${order.id}`, e);
    }
  }
}
