import type * as express from 'express';
import { AuthenticationController } from './AuthenticationController';

jest.mock('./auth/userAuthUtils', () => ({
  getUserFromRequestOrCreateAndSetCookie: jest.fn(),
}));
jest.mock('./auth/authCookieUtils', () => ({
  setAuthCookie: jest.fn(),
  clearAuthCookie: jest.fn(),
}));
jest.mock('../business/users/UserService', () => ({
  getUserIdFromToken: jest.fn().mockReturnValue(7),
  markEmailVerified: jest.fn().mockResolvedValue(undefined),
  createUserToken: jest.fn().mockReturnValue('permanent-token'),
}));

describe('AuthenticationController.loginWithMagicLink', () => {
  const originalFrontendBaseUrl = process.env.FRONTEND_BASE_URL;

  beforeAll(() => {
    process.env.FRONTEND_BASE_URL = 'https://1940s.nyc';
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterAll(() => {
    process.env.FRONTEND_BASE_URL = originalFrontendBaseUrl;
    jest.restoreAllMocks();
  });

  const loginAndGetRedirect = async (
    returnToPath?: string
  ): Promise<string> => {
    const redirect = jest.fn<void, [string]>();
    const req = { res: { redirect } } as unknown as express.Request;
    await new AuthenticationController().loginWithMagicLink(
      'magic-token',
      req,
      returnToPath
    );
    expect(redirect).toHaveBeenCalledTimes(1);
    return redirect.mock.calls[0][0];
  };

  it('redirects to the frontend root when no path is given', async () => {
    expect(await loginAndGetRedirect()).toBe('https://1940s.nyc/');
  });

  it('keeps a relative frontend path', async () => {
    expect(await loginAndGetRedirect('/map/photo/abc?x=1')).toBe(
      'https://1940s.nyc/map/photo/abc?x=1'
    );
  });

  it.each(['//evil.com', 'https://evil.com/x', '/\\evil.com'])(
    'falls back to the frontend root for %s',
    async (returnToPath) => {
      expect(await loginAndGetRedirect(returnToPath)).toBe(
        'https://1940s.nyc/'
      );
    }
  );
});
