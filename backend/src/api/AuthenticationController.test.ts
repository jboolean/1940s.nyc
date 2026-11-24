import type * as express from 'express';
import { AuthenticationController } from './AuthenticationController';

jest.mock('./auth/userAuthUtils', () => ({}));
jest.mock('./auth/authCookieUtils', () => ({ setAuthCookie: jest.fn() }));
jest.mock('../business/users/UserService', () => ({
  getUserIdFromToken: () => 7,
  markEmailVerified: jest.fn(),
  createUserToken: jest.fn(),
}));

process.env.FRONTEND_BASE_URL = 'https://1940s.nyc';

const redirectFor = async (returnToPath: string): Promise<string> => {
  const redirect = jest.fn<void, [string]>();
  const req = { res: { redirect } } as unknown as express.Request;
  await new AuthenticationController().loginWithMagicLink(
    't',
    req,
    returnToPath
  );
  return redirect.mock.calls[0][0];
};

it('keeps a relative path', async () => {
  expect(await redirectFor('/map?x=1')).toBe('https://1940s.nyc/map?x=1');
});

it.each(['//evil.com', 'https://evil.com/x', '/\\evil.com'])(
  'falls back to the root for %s',
  async (path) => {
    expect(await redirectFor(path)).toBe('https://1940s.nyc/');
  }
);
