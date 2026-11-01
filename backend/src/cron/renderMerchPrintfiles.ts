import { AppDataSource } from '../createConnection';
import { colorizeForPrint } from '../business/color/ColorService';
import {
  getMerchLabel,
  getPrintfileExtensionForVariant,
} from '../business/merch/merchCatalog';
import renderToteBag from '../business/merch/renderToteBag';
import { getPrintProduct } from '../business/prodigi/printCatalog';
import { logCountMetric } from '../business/utils/metrics';
import {
  copyOriginalToPrintJpeg,
  PrintfileExtension,
  uploadPrintfile,
} from '../business/utils/printfileUtils';
import MerchOrderItem from '../entities/MerchOrderItem';
import MerchCustomizationOptions, {
  PrintCustomizationOptions,
  ToteBagCustomizationOptions,
} from '../entities/MerchCustomizationOptions';
import MerchInternalVariant from '../enum/MerchInternalVariant';
import MerchItemState from '../enum/MerchItemState';
import MerchOrderState from '../enum/MerchOrderState';
import absurd from '../business/utils/absurd';

// Three items keeps a run inside the Lambda's 300s timeout even when each one hits the colorize cap.
const LIMIT = 3;
const COLORIZE_TIMEOUT_MS = 90_000;
export const MAX_PRINTFILE_ATTEMPTS = 5;
export const METRICS_NAMESPACE = 'fourtiesnyc/merch';

interface RenderedPrintfile {
  extension: PrintfileExtension;
  // Absent when the file is already in place, as it is for a server-side copy.
  buffer?: Buffer;
}

async function colorize(photoIdentifier: string): Promise<Buffer> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      colorizeForPrint(photoIdentifier),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Colorization timed out')),
          COLORIZE_TIMEOUT_MS
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function renderTote(
  item: MerchOrderItem,
  options: ToteBagCustomizationOptions
): Promise<RenderedPrintfile> {
  const { lat, lng, style, foregroundColor, backgroundColor } = options;
  // Throws on a tote whose coordinates are missing, which the attempt counter retries and then
  // gives up on.
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error(`Item ${item.id} has no coordinates to render`);
  }
  return {
    extension: getPrintfileExtensionForVariant(item.internalVariant),
    buffer: await renderToteBag({
      lat,
      lng,
      style,
      foregroundColor,
      backgroundColor,
    }),
  };
}

async function renderPrint(
  item: MerchOrderItem,
  options: PrintCustomizationOptions
): Promise<RenderedPrintfile> {
  if (!getPrintProduct(item.internalVariant)) {
    throw new Error(`No print product for ${item.internalVariant}`);
  }
  const extension = getPrintfileExtensionForVariant(item.internalVariant);
  if (options.colorize) {
    return { extension, buffer: await colorize(options.photoIdentifier) };
  }
  // A server-side copy of the full-resolution original, so the bytes never pass through here.
  await copyOriginalToPrintJpeg(item.id, options.photoIdentifier);
  return { extension };
}

function render(
  item: MerchOrderItem,
  options: MerchCustomizationOptions
): Promise<RenderedPrintfile> {
  switch (item.internalVariant) {
    case MerchInternalVariant.TOTE_BAG_SMALL:
      if (options.variant !== MerchInternalVariant.TOTE_BAG_SMALL) {
        throw new Error('Tote bag item does not carry tote bag options');
      }
      return renderTote(item, options);
    case MerchInternalVariant.PRINT_HPR_4X6:
    case MerchInternalVariant.PRINT_HPR_8X12:
    case MerchInternalVariant.PRINT_FAP_8X12_FRAMED:
      if (options.variant === MerchInternalVariant.TOTE_BAG_SMALL) {
        throw new Error('Print item does not carry print options');
      }
      return renderPrint(item, options);
    default:
      absurd(item.internalVariant);
  }
}

// Each item is handled on its own so one failure does not block others. Failures are retried; after
// MAX_PRINTFILE_ATTEMPTS the item moves to printfile_failed.
export default async function renderMerchPrintfiles(): Promise<void> {
  const repository = AppDataSource.getRepository(MerchOrderItem);
  const itemsToRender = await repository
    .createQueryBuilder('item')
    .innerJoinAndSelect('item.order', 'order')
    .where({ state: MerchItemState.CUSTOMIZED })
    .andWhere('order.state != :canceled', {
      canceled: MerchOrderState.CANCELED,
    })
    .orderBy('item.updatedAt', 'ASC')
    .limit(LIMIT)
    .getMany();

  for (const item of itemsToRender) {
    const label = getMerchLabel(item.internalVariant);
    const options = item.customizationOptions;
    const giveUp = async (reason: string): Promise<void> => {
      console.error(
        `[merch-alert] print file for ${label} item ${item.id} (order ${item.order.id}) gave up: ${reason}`
      );
      logCountMetric(METRICS_NAMESPACE, 'PrintfileGiveUp', {
        Stage: process.env.STAGE ?? 'unknown',
      });
      await repository.update(item.id, {
        state: MerchItemState.PRINTFILE_FAILED,
      });
    };

    if (!options) {
      await giveUp('no customization options');
      continue;
    }

    // Count the attempt first, so an item whose call hangs still runs out of attempts.
    const attempts = (item.printfileAttempts ?? 0) + 1;
    if (attempts > MAX_PRINTFILE_ATTEMPTS) {
      await giveUp(`still failing after ${MAX_PRINTFILE_ATTEMPTS} attempts`);
      continue;
    }
    await repository.update(item.id, {
      printfileAttempts: attempts,
    });

    console.log('[merch] Rendering printfile for item', item.id);
    try {
      const file = await render(item, options);
      if (file.buffer) {
        await uploadPrintfile(item.id, file.extension, file.buffer);
      }
      await repository.update(item.id, {
        state: MerchItemState.READY_FOR_FULFILLMENT,
      });
    } catch (e) {
      console.error(
        `[merch-alert] print file for ${label} item ${item.id} (order ${item.order.id}) failed, attempt ${attempts}`,
        e
      );
      await repository.update(item.id, {
        printfileError: String(e).slice(0, 500),
      });
    }
  }
}
