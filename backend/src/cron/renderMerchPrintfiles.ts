import { getRepository } from 'typeorm';
import renderToteBag from '../business/merch/renderToteBag';
import absurd from '../business/utils/absurd';
import { uploadPrintfile } from '../business/utils/printfileUtils';
import MerchOrderItem from '../entities/MerchOrderItem';
import MerchInternalVariant from '../enum/MerchInternalVariant';
import MerchItemState from '../enum/MerchItemState';

const LIMIT = 5;

export default async function renderMerch(): Promise<void> {
  const repository = getRepository(MerchOrderItem);
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

    const { lat, lng, style, foregroundColor, backgroundColor } =
      customizationOptions;

    const variant = item.internalVariant;

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
  }
}
