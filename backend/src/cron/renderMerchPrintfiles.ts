import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { getRepository } from 'typeorm';
import renderToteBag from '../business/merch/renderToteBag';
import isProduction from '../business/utils/isProduction';
import CustomMerchItem from '../entities/CustomMerchItem';

const s3 = new S3Client();

const LIMIT = 5;

export default async function renderMerch(): Promise<void> {
  const repository = getRepository(CustomMerchItem);
  const itemsToRender = await repository
    .createQueryBuilder('custom_merch_items')
    .where({
      printfileCreated: false,
      customizationOptionsSubmitted: true,
      orderCreated: false,
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

    const { lat, lon } = customizationOptions;

    const buffer = await renderToteBag({ lat, lon });

    const destinationDirectory = isProduction()
      ? 'printfiles'
      : 'printfiles-dev';

    const destinationKey = `merch/${destinationDirectory}/${item.id}.png`;

    await s3.send(
      new PutObjectCommand({
        Bucket: 'fourties-photos',
        Key: destinationKey,
        Body: buffer,
        ContentType: 'image/png',
      })
    );

    await repository.update(item.id, {
      printfileCreated: true,
    });
  }
}
