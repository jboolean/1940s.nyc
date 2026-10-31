import { In } from 'typeorm';

import { colorizeForPrint } from '../business/color/ColorService';
import { logCountMetric } from '../business/utils/metrics';
import {
  copyOriginalToPrintJpeg,
  uploadPrintJpeg,
} from '../business/utils/printfileUtils';
import {
  getPrintProduct,
  PRINT_PRODUCTS,
} from '../business/prodigi/printCatalog';
import { AppDataSource } from '../createConnection';
import { PrintCustomizationOptions } from '../entities/MerchCustomizationOptions';
import MerchOrderItem from '../entities/MerchOrderItem';
import MerchItemState from '../enum/MerchItemState';
import MerchOrderState from '../enum/MerchOrderState';

const LIMIT = 2;
const COLORIZE_TIMEOUT_MS = 90_000;
export const MAX_PRINTFILE_ATTEMPTS = 5;
export const METRICS_NAMESPACE = 'fourtiesnyc/merch';

const PRINT_VARIANTS = PRINT_PRODUCTS.map((product) => product.variant);

async function createPrintfile(
  item: MerchOrderItem,
  options: PrintCustomizationOptions
): Promise<void> {
  if (options.colorize) {
    let timer: NodeJS.Timeout | undefined;
    try {
      const image = await Promise.race([
        colorizeForPrint(options.photoIdentifier),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Colorization timed out')),
            COLORIZE_TIMEOUT_MS
          );
        }),
      ]);
      await uploadPrintJpeg(item.id, image);
    } finally {
      clearTimeout(timer);
    }
  } else {
    await copyOriginalToPrintJpeg(item.id, options.photoIdentifier);
  }
}

// Each item is handled on its own so one failure does not block others. Failures are retried; after
// MAX_PRINTFILE_ATTEMPTS the item moves to printfile_failed.
export default async function renderPrintfiles(): Promise<void> {
  const repository = AppDataSource.getRepository(MerchOrderItem);
  const items = await repository
    .createQueryBuilder('item')
    .innerJoinAndSelect('item.order', 'order')
    .where({
      state: MerchItemState.CUSTOMIZED,
      internalVariant: In(PRINT_VARIANTS),
    })
    .andWhere('order.state != :canceled', {
      canceled: MerchOrderState.CANCELED,
    })
    .orderBy('item.updatedAt', 'ASC')
    .limit(LIMIT)
    .getMany();

  for (const item of items) {
    const options = item.customizationOptions;
    if (
      !options ||
      !('photoIdentifier' in options) ||
      !getPrintProduct(item.internalVariant)
    ) {
      console.error('[prints] Item has no print customization', item.id);
      logCountMetric(METRICS_NAMESPACE, 'PrintfileGiveUp', {
        Stage: process.env.STAGE ?? 'unknown',
      });
      await repository.update(item.id, {
        state: MerchItemState.PRINTFILE_FAILED,
      });
      continue;
    }

    // Count the attempt first, so an item whose call hangs still runs out of attempts.
    const attempts = (item.printfileAttempts ?? 0) + 1;
    if (attempts > MAX_PRINTFILE_ATTEMPTS) {
      console.error(
        `[merch-alert] print file for item ${item.id} (order ${item.order.id}) gave up after ${MAX_PRINTFILE_ATTEMPTS} attempts`
      );
      logCountMetric(METRICS_NAMESPACE, 'PrintfileGiveUp', {
        Stage: process.env.STAGE ?? 'unknown',
      });
      await repository.update(item.id, {
        state: MerchItemState.PRINTFILE_FAILED,
      });
      continue;
    }
    await repository.update(item.id, {
      printfileAttempts: attempts,
    });

    console.log('[prints] Creating print file for item', item.id);
    try {
      await createPrintfile(item, options);
      await repository.update(item.id, {
        state: MerchItemState.READY_FOR_FULFILLMENT,
      });
    } catch (e) {
      console.error(
        `[merch-alert] print file for item ${item.id} (order ${item.order.id}) failed, attempt ${attempts}`,
        e
      );
      await repository.update(item.id, {
        printfileError: String(e).slice(0, 500),
      });
    }
  }
}
