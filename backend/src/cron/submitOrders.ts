import { In } from 'typeorm';
import * as MerchOrderService from '../business/merch/MerchOrderService';
import getFulfillmentProvider, {
  getProvidersWithoutReview,
  getProvidersWithStatusSync,
} from '../business/merch/providers/getFulfillmentProvider';
import { AppDataSource } from '../createConnection';
import MerchOrder from '../entities/MerchOrder';
import MerchOrderFulfillmentState from '../enum/MerchOrderFulfillmentState';
import MerchOrderState from '../enum/MerchOrderState';

const LIMIT = 5;

// No provider submits without review today, so this finds nothing to do. It exists for a provider
// given requiresReview: false. A submission that fails stays pending_submission and is retried
// on the next run.
export async function submitPendingOrders(): Promise<void> {
  const orders = await AppDataSource.getRepository(MerchOrder).find({
    where: {
      provider: In(getProvidersWithoutReview()),
      state: MerchOrderState.PENDING_SUBMISSION,
    },
    order: { updatedAt: 'ASC' },
    take: LIMIT,
  });

  for (const order of orders) {
    try {
      console.log('[merch] Submitting order', order.id);
      await MerchOrderService.submitOrderForFulfillment(order.id);
    } catch (e) {
      console.error(`[merch-alert] failed to submit order ${order.id}`, e);
    }
  }
}

// Catches missed callbacks. Also the only status update when the printer cannot reach us (local dev).
export async function syncSubmittedOrders(): Promise<void> {
  const repository = AppDataSource.getRepository(MerchOrder);
  const orders = await repository
    .createQueryBuilder('order')
    .where({
      provider: In(getProvidersWithStatusSync()),
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
      await getFulfillmentProvider(order.provider).syncSubmittedOrder?.(
        providerOrderId
      );
      // Touch the row so orders are visited in turn.
      await repository.update(order.id, { updatedAt: new Date() });
    } catch (e) {
      console.error(`[merch] Failed to sync order ${order.id}`, e);
    }
  }
}
