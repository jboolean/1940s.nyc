import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { NotFound } from 'http-errors';
import applyColorToOriginal from './applyColorToOriginal';
import * as LedgerService from '../ledger/LedgerService';
import isProduction from '../utils/isProduction';
import { colorizeImageWithAutoPromptBase64 } from '../utils/paletteApi';

const s3 = new S3Client();

// A lot of engineering went into this prompt
// One word can make a huge difference
const PROMPT =
  'Outdoor photo of city street with stone buildings and sign, trees, apartment neighborhood. brooklyn newyorkcity. A dramatic contrast in natural color. ';

type PaletteResolution = 'watermarked-sd' | 'sd' | '4k';

async function getSourceImage(sourceKey: string): Promise<Buffer> {
  const s3Response = await s3.send(
    new GetObjectCommand({
      Bucket: 'fourties-photos',
      Key: sourceKey,
    })
  );

  if (!s3Response.Body) {
    throw new NotFound('Original image not found');
  }

  return Buffer.from(await s3Response.Body.transformToByteArray());
}

async function colorizeImage(
  image: Buffer,
  resolution: PaletteResolution
): Promise<Buffer> {
  const { image: colorizedImageBase64 } =
    await colorizeImageWithAutoPromptBase64({
      image,
      resolution: resolution,
      prompt: PROMPT,
      raw_captions: true,
      auto_color: true,
      white_balance: true,
    });

  return Buffer.from(colorizedImageBase64, 'base64');
}

async function createColorVersion(
  sourceKey: string,
  destinationKey: string,
  useTestingResolution: boolean
): Promise<void> {
  const colorizedImage = await colorizeImage(
    await getSourceImage(sourceKey),
    useTestingResolution ? 'watermarked-sd' : 'sd'
  );

  await s3.send(
    new PutObjectCommand({
      Bucket: 'fourties-photos',
      Key: destinationKey,
      Body: colorizedImage,
      ContentType: 'image/jpeg',
    })
  );
}

/**
 * Colorizes an image at the highest quality Palette offers. Palette returns a downscaled result, so
 * its colour is laid over the original to keep the original's detail. The result is never smaller
 * than either the original or Palette's output.
 */
export async function colorizeAtFullResolution(image: Buffer): Promise<Buffer> {
  return applyColorToOriginal(image, await colorizeImage(image, '4k'));
}

/**
 * Colorizes the full-resolution photo for printing.
 * Not metered against the user's credits: the customer paid for the print.
 */
export async function colorizeForPrint(identifier: string): Promise<Buffer> {
  return colorizeAtFullResolution(
    await getSourceImage(`jpg/${identifier}.jpg`)
  );
}

/**
 * Colorizes an image and returns the URL to the image
 * @param identifier
 * @param userId
 * @returns
 */
export async function getColorizedImage(
  identifier: string,
  userId: number
): Promise<string> {
  const sourceKey = `jpg/${identifier}.jpg`;
  const destinationDirectory = isProduction() ? 'colorized' : 'colorized-dev';
  const destinationKey = `${destinationDirectory}/${identifier}.jpg`;

  // Check if image already exists
  const headObjectResponse = await s3
    .send(
      new HeadObjectCommand({
        Bucket: 'fourties-photos',
        Key: destinationKey,
      })
    )
    .catch(() => null);

  if (!headObjectResponse) {
    await LedgerService.withMeteredUsage(userId, identifier, async () => {
      await createColorVersion(sourceKey, destinationKey, !isProduction());
    });
  }

  return `https://photos.1940s.nyc/${destinationKey}`;
}

export function getBalance(userId: number): Promise<number> {
  return LedgerService.getBalance(userId);
}
