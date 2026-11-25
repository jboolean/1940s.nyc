import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import contentDisposition from 'content-disposition';
import { randomUUID } from 'crypto';
import { BadRequest } from 'http-errors';
import path from 'path';
import { validate as isUuid } from 'uuid';
import {
  BUCKET,
  colorizeAtFullResolution,
  colorizeS3Object,
} from './ColorService';
import isProduction from '../utils/isProduction';

const s3 = new S3Client();
// Without this the SDK signs the checksum of an empty body into presigned upload URLs.
const uploadPresigner = new S3Client({
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

const UPLOAD_DIRECTORY = isProduction()
  ? 'colorized-uploads'
  : 'colorized-uploads-dev';
const PRESIGNED_URL_EXPIRY_SECONDS = 10 * 60;

function isUploadKey(key: string): boolean {
  return (
    path.posix.dirname(key) === UPLOAD_DIRECTORY &&
    isUuid(path.posix.basename(key))
  );
}

/**
 * A presigned URL the browser can PUT an image to, for colorizeUploadedImage.
 */
export async function createUploadUrl(): Promise<{ key: string; url: string }> {
  const key = `${UPLOAD_DIRECTORY}/${randomUUID()}`;
  const url = await getSignedUrl(
    uploadPresigner,
    new PutObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS }
  );
  return { key, url };
}

/**
 * Colorizes an uploaded image exactly as a print is colorized and returns a short-lived download URL.
 * Not metered.
 */
export async function colorizeUploadedImage(
  key: string,
  filename: string
): Promise<string> {
  if (!isUploadKey(key)) {
    throw new BadRequest('Not an upload key');
  }

  const colorizedKey = `${key}-colorized.jpg`;
  await colorizeS3Object(key, colorizedKey, colorizeAtFullResolution);

  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: colorizedKey,
      ResponseContentDisposition: contentDisposition(filename),
    }),
    { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS }
  );
}
