import {
  CopyObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { bypassCloudflare } from './cloudflareOrigins';
import isProduction from './isProduction';

const s3 = new S3Client();

// Tote bags are rendered as PNGs and print orders are JPEGs.
export type PrintfileExtension = 'png' | 'jpg';

const CONTENT_TYPES: Record<PrintfileExtension, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
};

function getPrintfileKey(
  merchItemId: number,
  extension: PrintfileExtension
): string {
  const destinationDirectory = isProduction() ? 'printfiles' : 'printfiles-dev';
  return `merch/${destinationDirectory}/${merchItemId}.${extension}`;
}

export async function uploadPrintfile(
  merchItemId: number,
  extension: PrintfileExtension,
  buffer: Buffer
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: 'fourties-photos',
      Key: getPrintfileKey(merchItemId, extension),
      Body: buffer,
      ContentType: CONTENT_TYPES[extension],
      CacheControl: 'no-cache',
    })
  );
}

// Signed S3 URL for admin review.
export async function getPrintfileUrl(
  merchItemId: number,
  extension: PrintfileExtension
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: 'fourties-photos',
    Key: getPrintfileKey(merchItemId, extension),
  });

  return await getSignedUrl(s3, command, { expiresIn: 120 });
}

// Direct CloudFront URL (bypassing Cloudflare) for the printer's server fetch,
// which does a HEAD check before the GET (signed URLs can't support that).
// Prodigi sends no credentials at all, and going around Cloudflare keeps its bot
// protection from blocking either printer's fetch.
export function getPrintfileDirectUrl(
  merchItemId: number,
  extension: PrintfileExtension
): string {
  return bypassCloudflare(
    `https://photos.1940s.nyc/${getPrintfileKey(merchItemId, extension)}`
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
      Key: getPrintfileKey(merchItemId, 'jpg'),
      ContentType: CONTENT_TYPES.jpg,
      MetadataDirective: 'REPLACE',
      CacheControl: 'no-cache',
    })
  );
}
