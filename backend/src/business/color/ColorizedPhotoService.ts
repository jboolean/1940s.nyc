import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import contentDisposition from 'content-disposition';
import {
  BUCKET,
  colorizeAtFullResolution,
  colorizeS3Object,
  getOriginalKey,
} from './ColorService';
import isProduction from '../utils/isProduction';

const s3 = new S3Client();

const DESTINATION_DIRECTORY = isProduction()
  ? 'colorized-full-resolution'
  : 'colorized-full-resolution-dev';
const PRESIGNED_URL_EXPIRY_SECONDS = 10 * 60;

/**
 * Colorizes a photo's full-resolution original exactly as a print is colorized and returns a
 * short-lived download URL.
 * Not metered.
 */
export async function colorizeForDownload(identifier: string): Promise<string> {
  const destinationKey = `${DESTINATION_DIRECTORY}/${identifier}.jpg`;
  await colorizeS3Object(
    getOriginalKey(identifier),
    destinationKey,
    colorizeAtFullResolution
  );

  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: destinationKey,
      ResponseContentDisposition: contentDisposition(
        `${identifier}-colorized.jpg`
      ),
    }),
    { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS }
  );
}
