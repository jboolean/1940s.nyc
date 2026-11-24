import {
  CopyObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import type MerchOrderItem from '../../entities/MerchOrderItem';
import { bypassCloudflare } from './cloudflareOrigins';
import isProduction from './isProduction';

const s3 = new S3Client();

// Tote bags are rendered as PNGs and print orders are JPEGs.
export type PrintfileExtension = 'png' | 'jpg';

const CONTENT_TYPES: Record<PrintfileExtension, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
};

export type PrintfileItem = Pick<MerchOrderItem, 'id' | 'printfileToken'>;

export function newPrintfileToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Print files are public so printers can fetch them, so the key must not be guessable from the item
// id. Items rendered before tokens existed have none, and their files stay at the id-only key.
export function getPrintfileKey(
  item: PrintfileItem,
  extension: PrintfileExtension
): string {
  const destinationDirectory = isProduction() ? 'printfiles' : 'printfiles-dev';
  const name = item.printfileToken
    ? `${item.id}-${item.printfileToken}`
    : `${item.id}`;
  return `merch/${destinationDirectory}/${name}.${extension}`;
}

export async function uploadPrintfile(
  item: PrintfileItem,
  extension: PrintfileExtension,
  buffer: Buffer
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: 'fourties-photos',
      Key: getPrintfileKey(item, extension),
      Body: buffer,
      ContentType: CONTENT_TYPES[extension],
      CacheControl: 'no-cache',
    })
  );
}

// Signed S3 URL for admin review.
export async function getPrintfileUrl(
  item: PrintfileItem,
  extension: PrintfileExtension
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: 'fourties-photos',
    Key: getPrintfileKey(item, extension),
  });

  return await getSignedUrl(s3, command, { expiresIn: 120 });
}

// Direct CloudFront URL (bypassing Cloudflare) for the printer's server fetch,
// which does a HEAD check before the GET (signed URLs can't support that).
// Prodigi sends no credentials at all, and going around Cloudflare keeps its bot
// protection from blocking either printer's fetch.
export function getPrintfileDirectUrl(
  item: PrintfileItem,
  extension: PrintfileExtension
): string {
  return bypassCloudflare(
    `https://photos.1940s.nyc/${getPrintfileKey(item, extension)}`
  );
}

// Signed S3 URL of the original photo, for shipping quotes before a print file exists. WHCC's fetch
// sends no referer and can't add the direct origin's verify header, so it can't use either photo URL.
export async function getOriginalSignedUrl(
  photoIdentifier: string
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: 'fourties-photos',
    Key: `jpg/${photoIdentifier}.jpg`,
  });

  return await getSignedUrl(s3, command, { expiresIn: 600 });
}

// Server-side copy of the full-resolution original, without downloading it.
export async function copyOriginalToPrintJpeg(
  item: PrintfileItem,
  photoIdentifier: string
): Promise<void> {
  await s3.send(
    new CopyObjectCommand({
      Bucket: 'fourties-photos',
      CopySource: `fourties-photos/jpg/${photoIdentifier}.jpg`,
      Key: getPrintfileKey(item, 'jpg'),
      ContentType: CONTENT_TYPES.jpg,
      MetadataDirective: 'REPLACE',
      CacheControl: 'no-cache',
    })
  );
}
