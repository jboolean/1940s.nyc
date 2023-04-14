import AWS, { AWSError } from 'aws-sdk';
import { NotFound } from 'http-errors';
import { colorizeImageWithAutoPromptBase64 } from '../utils/paletteApi';

const s3 = new AWS.S3();

const PROMPT =
  'Outdoor photo of city street with stone buildings and sign, trees, apartment neighborhood. brooklyn newyorkcity. A dramatic contrast in natural color. ';

/**
 * Colorizes an image and returns the URL to the image
 * @param identifier
 * @returns
 */
export async function getColorizedImage(identifier: string): Promise<string> {
  const destinationKey = `colorized/${identifier}.jpg`;

  // Check if image already exists
  const headObjectResponse = await s3
    .headObject({
      Bucket: 'fourties-photos',
      Key: destinationKey,
    })
    .promise()
    .catch(() => null);

  if (!headObjectResponse) {
    try {
      // Retrieve image from s3
      const s3Response = await s3
        .getObject({
          Bucket: 'fourties-photos',
          Key: `originals/${identifier}`,
        })
        .promise();

      // Create buffer from image
      const buffer = s3Response.Body as Buffer;

      const { image: colorizedImageBase64 } =
        await colorizeImageWithAutoPromptBase64({
          image: buffer,
          resolution: 'watermarked-sd',
          prompt: PROMPT,
          raw_captions: true,
          auto_color: true,
          white_balance: true,
        });

      const colorizedImage = Buffer.from(colorizedImageBase64, 'base64');

      await s3
        .putObject({
          Bucket: 'fourties-photos',
          Key: `colorized/${identifier}.jpg`,
          Body: colorizedImage,
          ContentType: 'image/jpeg',
        })
        .promise();
    } catch (error: unknown) {
      const awsError = error as AWSError;

      if (awsError.code === 'NoSuchKey') {
        throw new NotFound('Original image not found');
      }

      throw error;
    }
  }

  return `https://photos.1940s.nyc/colorized/${identifier}.jpg`;
}
