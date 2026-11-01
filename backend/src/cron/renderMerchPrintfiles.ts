import { AppDataSource } from '../createConnection';
import { colorizeForPrint } from '../business/color/ColorService';
import {
  getMerchLabel,
  getPrintfileExtensionForVariant,
} from '../business/merch/merchCatalog';
import renderToteBag from '../business/merch/renderToteBag';
import { getPrintProduct } from '../business/prodigi/printCatalog';
import {
  copyOriginalToPrintJpeg,
  PrintfileExtension,
  uploadPrintfile,
} from '../business/utils/printfileUtils';
import { logCountMetric } from '../business/utils/metrics';
import MerchOrderItem from '../entities/MerchOrderItem';
import MerchCustomizationOptions, {
  PrintCustomizationOptions,
  ToteBagCustomizationOptions,
} from '../entities/MerchCustomizationOptions';
import MerchInternalVariant from '../enum/MerchInternalVariant';
import MerchItemState from '../enum/MerchItemState';
import MerchOrderState from '../enum/MerchOrderState';

// The Lambda allows 300s and the submit and sync steps that run before rendering share it, so
// rendering keeps to RENDER_BUDGET_MS. Colorizing is the one render that can take a minute, so it is
// budgeted separately; the rest are a tote's map render or a server-side copy, capped at
// ITEM_TIMEOUT_MS. The batch is what fits both caps inside the budget, so neither a long queue nor
// one hung render can push a run past it.
const RENDER_BUDGET_MS = 270_000;
const COLORIZE_TIMEOUT_MS = 90_000;
// Above the ~65s a tote takes on puppeteer's defaults, so this catches a hang rather than a slow
// but working render.
const ITEM_TIMEOUT_MS = 75_000;
export const MAX_COLORIZED_PER_RUN = 2;
const BATCH_LIMIT =
  MAX_COLORIZED_PER_RUN +
  Math.floor(
    (RENDER_BUDGET_MS - MAX_COLORIZED_PER_RUN * COLORIZE_TIMEOUT_MS) /
      ITEM_TIMEOUT_MS
  );
export const MAX_PRINTFILE_ATTEMPTS = 5;
export const METRICS_NAMESPACE = 'fourtiesnyc/merch';

interface RenderedPrintfile {
  extension: PrintfileExtension;
  // Absent when the file is already in place, as it is for a server-side copy.
  buffer?: Buffer;
}

// The work behind the timeout is not cancelled, so a render that is still running when its slot ends
// keeps running in the background. It is bounded by the batch size and the invocation ends with it.
export async function withTimeout<T>(
  ms: number,
  what: string,
  work: Promise<T>
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  let timedOut = false;
  // The work is not cancelled and can still fail after its slot has ended, and the stored error
  // only says that it timed out, so the cause is logged here rather than lost. Before the timeout
  // the rejection is the caller's to handle, so it is left alone.
  void work.catch((e) => {
    if (timedOut) {
      console.error(`${what} failed after its timeout`, e);
    }
  });
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          timedOut = true;
          reject(new Error(`${what} timed out`));
        }, ms);
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
    buffer: await withTimeout(
      ITEM_TIMEOUT_MS,
      'Tote bag render',
      renderToteBag({
        lat,
        lng,
        style,
        foregroundColor,
        backgroundColor,
      })
    ),
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
    return {
      extension,
      buffer: await withTimeout(
        COLORIZE_TIMEOUT_MS,
        'Colorization',
        colorizeForPrint(options.photoIdentifier)
      ),
    };
  }
  // A server-side copy of the full-resolution original, so the bytes never pass through here.
  await withTimeout(
    ITEM_TIMEOUT_MS,
    'Original copy',
    copyOriginalToPrintJpeg(item.id, options.photoIdentifier)
  );
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
    // The readers tolerate a variant this build no longer sells and degrade, so the renderer does
    // too: an unknown one is a variant nothing here can print, not a bug in the code. Throwing the
    // variant by name keeps the stored error honest, where asserting it was unreachable would have
    // the item fail every attempt with no real reason.
    default:
      throw new Error(
        `No renderer for variant ${String(item.internalVariant)}`
      );
  }
}

function needsColorizing(
  item: MerchOrderItem,
  options: MerchCustomizationOptions
): boolean {
  return (
    item.internalVariant !== MerchInternalVariant.TOTE_BAG_SMALL &&
    options.variant !== MerchInternalVariant.TOTE_BAG_SMALL &&
    options.colorize
  );
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
    .limit(BATCH_LIMIT)
    .getMany();

  // Oldest first, so the colorize budget goes to the items that have waited longest; the rest wait
  // for the next run, which is a few minutes away.
  let colorizedThisRun = 0;

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

    // Spend the colorize budget only on an item that will actually render, so an exhausted one
    // gives up without costing a fresh item its slot.
    if (needsColorizing(item, options)) {
      if (colorizedThisRun >= MAX_COLORIZED_PER_RUN) {
        continue;
      }
      colorizedThisRun += 1;
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
