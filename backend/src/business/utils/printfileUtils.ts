import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

// Signed S3 URL for admin review.
export async function getPrintfileUrl(
  customMerchItemId: number
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: 'fourties-photos',
    Key: getPrintfileKey(customMerchItemId),
  });

  return await getSignedUrl(s3, command, { expiresIn: 120 });
}

// Direct CloudFront URL (bypassing Cloudflare) for Printful's server fetch,
// which does a HEAD check before the GET (signed URLs can't support that).
export function getPrintfileDirectUrl(customMerchItemId: number): string {
  return bypassCloudflare(
    `https://photos.1940s.nyc/${getPrintfileKey(customMerchItemId)}`
  );
}
