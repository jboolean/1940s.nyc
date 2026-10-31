import type { Repository } from 'typeorm';

import { AppDataSource } from '../createConnection';
import renderToteBag from '../business/merch/renderToteBag';
import absurd from '../business/utils/absurd';
import { logCountMetric } from '../business/utils/metrics';
import { uploadPrintfile } from '../business/utils/printfileUtils';
import MerchOrderItem from '../entities/MerchOrderItem';
import MerchInternalVariant from '../enum/MerchInternalVariant';
import MerchItemState from '../enum/MerchItemState';

const LIMIT = 5;
export const MAX_PRINTFILE_ATTEMPTS = 5;
export const METRICS_NAMESPACE = 'fourtiesnyc/merch';

// An item that cannot be rendered at all is not retried, so it is marked failed for a person to look at.
async function giveUp(
  repository: Repository<MerchOrderItem>,
  item: MerchOrderItem,
  reason: string
): Promise<void> {
  console.error(
    `[merch-alert] print file for item ${item.id} gave up: ${reason}`
  );
  logCountMetric(METRICS_NAMESPACE, 'PrintfileGiveUp', {
    Stage: process.env.STAGE ?? 'unknown',
  });
  await repository.update(item.id, {
    state: MerchItemState.PRINTFILE_FAILED,
  });
}

// Each item is handled on its own so one failure does not block others. Failures are retried; after
// MAX_PRINTFILE_ATTEMPTS the item moves to printfile_failed.
export default async function renderMerch(): Promise<void> {
  const repository = AppDataSource.getRepository(MerchOrderItem);
  const itemsToRender = await repository
    .createQueryBuilder('custom_merch_items')
    .where({
      state: MerchItemState.CUSTOMIZED,
    })
    .orderBy('custom_merch_items.updatedAt', 'ASC')
    .limit(LIMIT)
    .getMany();

  for (const item of itemsToRender) {
    console.log('[merch] Rendering printfile for item', item.id);

    const customizationOptions = item.customizationOptions;
    if (!customizationOptions) {
      await giveUp(repository, item, 'no customization options');
      continue;
    }

    // Count the attempt first, so an item whose render hangs still runs out of attempts.
    const attempts = (item.printfileAttempts ?? 0) + 1;
    if (attempts > MAX_PRINTFILE_ATTEMPTS) {
      await giveUp(
        repository,
        item,
        `gave up after ${MAX_PRINTFILE_ATTEMPTS} attempts`
      );
      continue;
    }
    await repository.update(item.id, {
      printfileAttempts: attempts,
    });

    const { lat, lng, style, foregroundColor, backgroundColor } =
      customizationOptions;

    const variant = item.internalVariant;

    try {
      let buffer: Buffer;
      switch (variant) {
        case MerchInternalVariant.TOTE_BAG_SMALL:
          buffer = await renderToteBag({
            lat,
            lng,
            style,
            foregroundColor,
            backgroundColor,
          });
          break;
        default:
          absurd(variant);
      }

      await uploadPrintfile(item.id, buffer);

      await repository.update(item.id, {
        state: MerchItemState.READY_FOR_FULFILLMENT,
      });
    } catch (e) {
      console.error(
        `[merch-alert] print file for item ${item.id} failed, attempt ${attempts}`,
        e
      );
      await repository.update(item.id, {
        printfileError: String(e).slice(0, 500),
      });
    }
  }
}
