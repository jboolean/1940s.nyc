import * as UserService from '../../business/users/UserService';
import * as express from 'express';
import { setAuthCookie } from './authCookieUtils';

export const USER_TOKEN_COOKIE = 'user-token';

/**
 * This works on a request with @Security('user-token') and will either return the user id from the request or create a new user and set a cookie on the response.
 * @param req express.Request
 * @returns
 */
export async function getUserFromRequestOrCreateAndSetCookie(
  req: express.Request & { user?: { id: number } }
): Promise<number> {
  let token: string | undefined;
  let userId: number | undefined;
  if (req.user) {
    userId = req.user.id;
    token = UserService.createUserToken(userId);
  }

  const res = req.res;
  if (!res) {
    throw new Error('No response object');
  }

  if (!token || !userId) {
    const userCreationResult = await UserService.createUser(req.ip);
    userId = userCreationResult.userId;
    token = userCreationResult.token;
  }

  // We always set the cookie because some browsers now cap the cookie expiration date
  setAuthCookie(token, res);

  req.user = { id: userId };
  return userId;
}
