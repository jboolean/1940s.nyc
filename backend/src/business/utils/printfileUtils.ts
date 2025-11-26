import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
    })
  );
}

export async function getPrintfileUrl(
  customMerchItemId: number
): Promise<string> {
  const destinationKey = getPrintfileKey(customMerchItemId);

  const command = new GetObjectCommand({
    Bucket: 'fourties-photos',
    Key: destinationKey,
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 120 });

  return signedUrl;
}
