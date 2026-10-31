import {
  createCallbackToken,
  isValidCallbackToken,
} from './prodigiCallbackAuth';

describe('prodigi callback tokens', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'secret';
  });

  it('accepts the token for the same order', () => {
    expect(isValidCallbackToken(5, createCallbackToken(5))).toBe(true);
  });

  it('rejects another order, a wrong token and a malformed token', () => {
    expect(isValidCallbackToken(6, createCallbackToken(5))).toBe(false);
    expect(isValidCallbackToken(5, 'x'.repeat(64))).toBe(false);
    expect(isValidCallbackToken(5, 'short')).toBe(false);
  });

  it('depends on the server secret', () => {
    const token = createCallbackToken(5);
    process.env.JWT_SECRET = 'other';
    expect(isValidCallbackToken(5, token)).toBe(false);
  });
});
