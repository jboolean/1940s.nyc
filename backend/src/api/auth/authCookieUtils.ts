import * as Express from 'express';
export const USER_TOKEN_COOKIE = 'user-token';

interface Cookies {
  [USER_TOKEN_COOKIE]?: string;
}

export function setAuthCookie(token: string, res: Express.Response): void {
  res.cookie(USER_TOKEN_COOKIE, token, {
    httpOnly: true,
    // do not expire
    expires: new Date(253402300000000),
    sameSite: 'strict',
  });
}

export function getAuthCookie(req: Express.Request): string | undefined {
  return (req.cookies as Cookies)[USER_TOKEN_COOKIE];
}

export function clearAuthCookie(res: Express.Response): void {
  res.clearCookie(USER_TOKEN_COOKIE);
}
