import {
  CopyObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { bypassCloudflare } from './cloudflareOrigins';
import isProduction from './isProduction';
import required from './required';

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

function getPrintJpegKey(merchItemId: number): string {
  const destinationDirectory = isProduction() ? 'prints' : 'prints-dev';
  // Not guessable from the item id alone; Prodigi fetches this without credentials.
  const suffix = crypto
    .createHmac('sha256', required(process.env.JWT_SECRET, 'JWT_SECRET'))
    .update(`print-jpeg:${merchItemId}`)
    .digest('hex')
    .slice(0, 16);
  return `merch/${destinationDirectory}/${merchItemId}-${suffix}.jpg`;
}

export async function uploadPrintJpeg(
  merchItemId: number,
  buffer: Buffer
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: 'fourties-photos',
      Key: getPrintJpegKey(merchItemId),
      Body: buffer,
      ContentType: 'image/jpeg',
      CacheControl: 'no-cache',
    })
  );
}

// Server-side copy of the full-resolution original, without downloading it.
export async function copyOriginalToPrintJpeg(
  merchItemId: number,
  photoIdentifier: string
): Promise<void> {
  await s3.send(
    new CopyObjectCommand({
      Bucket: 'fourties-photos',
      CopySource: `fourties-photos/jpg/${photoIdentifier}.jpg`,
      Key: getPrintJpegKey(merchItemId),
      ContentType: 'image/jpeg',
      MetadataDirective: 'REPLACE',
      CacheControl: 'no-cache',
    })
  );
}

// Plain unsigned URL on the direct origin. Prodigi fetches it with GET (user agent
// Prodigi-Fulfilment/1.0), and going around Cloudflare keeps its bot protection from blocking the fetch.
export function getPrintJpegDirectUrl(merchItemId: number): string {
  return bypassCloudflare(
    `https://photos.1940s.nyc/${getPrintJpegKey(merchItemId)}`
  );
}
