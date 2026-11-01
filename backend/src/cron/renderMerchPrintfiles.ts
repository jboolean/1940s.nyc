import { AppDataSource } from '../createConnection';
import renderToteBag from '../business/merch/renderToteBag';
import { uploadPrintfile } from '../business/utils/printfileUtils';
import MerchOrderItem from '../entities/MerchOrderItem';
import MerchInternalVariant from '../enum/MerchInternalVariant';
import MerchItemState from '../enum/MerchItemState';

const LIMIT = 5;

export default async function renderMerch(): Promise<void> {
  const repository = AppDataSource.getRepository(MerchOrderItem);
  const itemsToRender = await repository
    .createQueryBuilder('custom_merch_items')
    .where({
      state: MerchItemState.CUSTOMIZED,
    })
    .limit(LIMIT)
    .getMany();

  for (const item of itemsToRender) {
    console.log('[merch] Rendering printfile for item', item.id);

    const customizationOptions = item.customizationOptions;
    if (!customizationOptions) {
      console.error('Customization options missing for item', item.id);
      continue;
    }

    let buffer: Buffer;
    switch (item.internalVariant) {
      case MerchInternalVariant.TOTE_BAG_SMALL:
        if (
          customizationOptions.variant !== MerchInternalVariant.TOTE_BAG_SMALL
        ) {
          console.error('Not a tote bag item', item.id);
          continue;
        }
        buffer = await renderToteBag(customizationOptions);
        break;
      default:
        console.error(
          'No tote bag renderer for variant',
          item.internalVariant,
          item.id
        );
        continue;
    }

    await uploadPrintfile(item.id, buffer);

    await repository.update(item.id, {
      state: MerchItemState.READY_FOR_FULFILLMENT,
    });
  }
}
