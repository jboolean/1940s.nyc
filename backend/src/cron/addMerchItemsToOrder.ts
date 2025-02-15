import { getRepository } from 'typeorm';
import * as PrintfulService from '../business/merch/PrintfulService';
import MerchOrder from '../entities/MerchOrder';
import MerchOrderItem from '../entities/MerchOrderItem';
import MerchItemState from '../enum/MerchItemState';
import MerchOrderState from '../enum/MerchOrderState';

const LIMIT = 5;

export default async function addMerchItemsToOrder(): Promise<void> {
  const itemRepository = getRepository(MerchOrderItem);
  const orderRepository = getRepository(MerchOrder);
  const items = await itemRepository
    .createQueryBuilder('custom_merch_items')
    .leftJoinAndSelect('custom_merch_items.order', 'order')
    .where({
      state: MerchItemState.READY_FOR_FULFILLMENT,
    })
    .limit(LIMIT)
    .getMany();

  for (const item of items) {
    await PrintfulService.addItemToOrder(item);

    await itemRepository.update(item.id, {
      state: MerchItemState.ADDED_TO_ORDER,
    });

    // Determine if all items in the order have been added
    const order = await orderRepository.findOneByOrFail({ id: item.order.id });
    const allItemsAdded = order.items.every(
      (i) => i.state === MerchItemState.ADDED_TO_ORDER
    );

    if (allItemsAdded) {
      order.state = MerchOrderState.PENDING_SUBMISSION;
      await orderRepository.save(order);
    }
  }
}
