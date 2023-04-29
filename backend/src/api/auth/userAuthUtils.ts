import * as UserService from '../../business/users/UserService';
import * as express from 'express';

export const USER_TOKEN_COOKIE = 'user-token';

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
  res.cookie(USER_TOKEN_COOKIE, token, {
    httpOnly: true,
    // do not expire
    expires: new Date(253402300000000),
    sameSite: 'strict',
  });

  req.user = { id: userId };
  return userId;
}
