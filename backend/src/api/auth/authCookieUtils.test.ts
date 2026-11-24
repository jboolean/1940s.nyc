import type * as Express from 'express';
import { USER_TOKEN_COOKIE, setAuthCookie } from './authCookieUtils';

describe('setAuthCookie', () => {
  const originalStage = process.env.STAGE;

  afterEach(() => {
    if (originalStage === undefined) {
      delete process.env.STAGE;
    } else {
      process.env.STAGE = originalStage;
    }
  });

  function cookieOptions(): Express.CookieOptions {
    const cookie = jest.fn<void, [string, string, Express.CookieOptions]>();
    setAuthCookie('token', { cookie } as unknown as Express.Response);
    expect(cookie).toHaveBeenCalledWith(
      USER_TOKEN_COOKIE,
      'token',
      expect.anything()
    );
    return cookie.mock.calls[0][2];
  }

  it.each(['production', 'staging'])('is secure on %s', (stage) => {
    process.env.STAGE = stage;
    expect(cookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
    });
  });

  it('is not secure in local dev over http', () => {
    process.env.STAGE = 'dev';
    expect(cookieOptions().secure).toBe(false);
  });
});
