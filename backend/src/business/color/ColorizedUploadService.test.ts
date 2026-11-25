import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { colorizeUploadedImage } from './ColorizedUploadService';
import { colorizeImageWithAutoPromptBase64 } from '../utils/paletteApi';

jest.mock('@aws-sdk/client-s3', () => {
  const send = jest.fn();
  return {
    S3Client: jest.fn(() => ({ send })),
    GetObjectCommand: jest.fn((input: unknown) => input),
    PutObjectCommand: jest.fn((input: unknown) => input),
  };
});
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn((_client: unknown, command: { Key: string }) =>
    Promise.resolve(`https://signed/${command.Key}`)
  ),
}));
jest.mock('../ledger/LedgerService', () => ({}));
jest.mock('../utils/paletteApi', () => ({
  colorizeImageWithAutoPromptBase64: jest.fn(),
}));

const UPLOAD_KEY = 'colorized-uploads-dev/0b5e3c1e-8a4f-4c2b-9d7e-2f6a1b3c4d5e';
const send = new S3Client().send as jest.Mock;

const jpeg = (background: string): Promise<Buffer> =>
  sharp({ create: { width: 20, height: 10, channels: 3, background } })
    .jpeg()
    .toBuffer();

it('rejects a key outside the upload folder', async () => {
  await expect(
    colorizeUploadedImage('jpg/x.jpg', 'x.jpg')
  ).rejects.toMatchObject({ statusCode: 400 });
});

it('writes the blended JPEG and returns its presigned URL', async () => {
  (colorizeImageWithAutoPromptBase64 as jest.Mock).mockResolvedValue({
    image: (await jpeg('red')).toString('base64'),
  });
  send.mockResolvedValue({
    Body: { transformToByteArray: () => jpeg('gray') },
  });

  const url = await colorizeUploadedImage(UPLOAD_KEY, 'photo.jpg');

  expect(url).toBe(`https://signed/${UPLOAD_KEY}-colorized.jpg`);
  const put = (
    (PutObjectCommand as unknown as jest.Mock).mock.calls as [
      { Key: string; ContentType: string; Body: Buffer },
    ][]
  )
    .map(([input]) => input)
    .find((input) => input.Key === `${UPLOAD_KEY}-colorized.jpg`);
  if (!put) {
    throw new Error('The colorized image was not written to S3');
  }
  expect(put.ContentType).toBe('image/jpeg');
  await expect(sharp(put.Body).metadata()).resolves.toMatchObject({
    format: 'jpeg',
    width: 20,
    height: 10,
  });
});
