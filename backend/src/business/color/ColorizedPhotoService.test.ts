import { NoSuchKey, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { colorizeForDownload } from './ColorizedPhotoService';
import { colorizeImageWithAutoPromptBase64 } from '../utils/paletteApi';

jest.mock('@aws-sdk/client-s3', () => {
  const send = jest.fn();
  class NoSuchKey extends Error {}
  return {
    NoSuchKey,
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

const IDENTIFIER = 'abc123';
const send = new S3Client().send as jest.Mock;

const jpeg = (background: string): Promise<Buffer> =>
  sharp({ create: { width: 20, height: 10, channels: 3, background } })
    .jpeg()
    .toBuffer();

it('rejects an identifier with no original photo', async () => {
  send.mockRejectedValue(new NoSuchKey({ message: '', $metadata: {} }));

  await expect(colorizeForDownload('missing')).rejects.toMatchObject({
    statusCode: 404,
  });
});

it('writes the blended full-resolution JPEG and returns its presigned URL', async () => {
  (colorizeImageWithAutoPromptBase64 as jest.Mock).mockResolvedValue({
    image: (await jpeg('red')).toString('base64'),
  });
  send.mockResolvedValue({
    Body: { transformToByteArray: () => jpeg('gray') },
  });

  const url = await colorizeForDownload(IDENTIFIER);

  expect(url).toBe(`https://signed/colorized-full-resolution-dev/abc123.jpg`);
  const put = (
    (PutObjectCommand as unknown as jest.Mock).mock.calls as [
      { Key: string; ContentType: string; Body: Buffer },
    ][]
  )[0][0];
  expect(put.Key).toBe('colorized-full-resolution-dev/abc123.jpg');
  await expect(sharp(put.Body).metadata()).resolves.toMatchObject({
    format: 'jpeg',
    width: 20,
    height: 10,
  });
});
