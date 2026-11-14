import { getAuthorizationHeader } from './createClientConfig';

afterEach(() => {
  delete process.env.WHCC_SK;
});

it('builds a bearer header from the key', () => {
  process.env.WHCC_SK = 'key';
  expect(getAuthorizationHeader()).toBe('Bearer key');
});

it('throws when the key is empty', () => {
  process.env.WHCC_SK = '';
  expect(() => getAuthorizationHeader()).toThrow('WHCC_SK');
});
