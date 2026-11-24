const send = jest.fn();
jest.mock('@aws-sdk/client-s3', () => {
  const actual =
    jest.requireActual<typeof import('@aws-sdk/client-s3')>(
      '@aws-sdk/client-s3'
    );
  return { ...actual, S3Client: jest.fn(() => ({ send })) };
});

process.env.CLOUDFLARE_BYPASS_ORIGINS = JSON.stringify({
  'photos.1940s.nyc': 'https://direct.cloudfront.example',
});

import {
  copyOriginalToPrintJpeg,
  getPrintfileDirectUrl,
  getPrintfileKey,
  newPrintfileToken,
  uploadPrintfile,
} from './printfileUtils';

const originalStage = process.env.STAGE;

beforeEach(() => {
  send.mockReset();
  process.env.STAGE = 'production';
});

afterAll(() => {
  process.env.STAGE = originalStage;
});

it('makes a new token unguessable and different each time', () => {
  const token = newPrintfileToken();
  expect(token).toMatch(/^[0-9a-f]{32}$/);
  expect(newPrintfileToken()).not.toBe(token);
});

it('keys an item with a token by its id and token', () => {
  expect(getPrintfileKey({ id: 3, printfileToken: 'abc' }, 'jpg')).toBe(
    'merch/printfiles/3-abc.jpg'
  );
});

it('keeps the id-only key for an item rendered before tokens', () => {
  expect(getPrintfileKey({ id: 3, printfileToken: null }, 'png')).toBe(
    'merch/printfiles/3.png'
  );
  expect(getPrintfileKey({ id: 3 }, 'png')).toBe('merch/printfiles/3.png');
});

it('writes print files to the key the direct URL points at', async () => {
  const item = { id: 3, printfileToken: 'abc' };

  await uploadPrintfile(item, 'png', Buffer.from('png'));
  await copyOriginalToPrintJpeg(item, 'photo-1');

  const keys = send.mock.calls.map(
    ([command]: [{ input: { Key: string } }]) => command.input.Key
  );
  expect(keys).toEqual([
    'merch/printfiles/3-abc.png',
    'merch/printfiles/3-abc.jpg',
  ]);
  expect(getPrintfileDirectUrl(item, 'png')).toBe(
    'https://direct.cloudfront.example/merch/printfiles/3-abc.png'
  );
  expect(getPrintfileDirectUrl(item, 'jpg')).toBe(
    'https://direct.cloudfront.example/merch/printfiles/3-abc.jpg'
  );
});

it('points the direct URL of an item rendered before tokens at its old key', () => {
  expect(getPrintfileDirectUrl({ id: 3, printfileToken: null }, 'jpg')).toBe(
    'https://direct.cloudfront.example/merch/printfiles/3.jpg'
  );
});
