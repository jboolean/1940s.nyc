import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { bypassCloudflare } from './cloudflareOrigins';
import isProduction from './isProduction';

const s3 = new S3Client();

function getPrintfileKey(customMerchItemId: number): string {
  const destinationDirectory = isProduction() ? 'printfiles' : 'printfiles-dev';
  return `merch/${destinationDirectory}/${customMerchItemId}.png`;
}

export async function uploadPrintfile(
  customMerchItemId: number,
  buffer: Buffer
): Promise<void> {
  const destinationKey = getPrintfileKey(customMerchItemId);

  await s3.send(
    new PutObjectCommand({
      Bucket: 'fourties-photos',
      Key: destinationKey,
      Body: buffer,
      ContentType: 'image/png',
      CacheControl: 'no-cache',
    })
  );
}

export function getPrintfileUrl(customMerchItemId: number): string {
  const destinationKey = getPrintfileKey(customMerchItemId);

  return bypassCloudflare(`https://photos.1940s.nyc/${destinationKey}`);
}
