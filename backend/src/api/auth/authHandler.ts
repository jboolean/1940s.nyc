import * as Express from 'express';
import { UserData } from 'gotrue-js';
import { Unauthorized } from 'http-errors';
import * as UserService from '../../business/users/UserService';
import getNetfilyUser from '../../business/utils/getNetlifyUser';
import { getAuthCookie } from './authCookieUtils';

interface NetlifyMetadata {
  roles: string[];
}

interface EndUser {
  id: number;
}

export async function expressAuthentication(
  req: Express.Request,
  securityName: string,
  scopes?: string[]
): Promise<UserData | null | EndUser> {
  // User for admin endpoints
  if (securityName === 'netlify') {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Unauthorized('No auth header');
    }
    const token = authHeader.split(' ')[1];

    try {
      const user = await getNetfilyUser(token);

      // check that it has the required scopes
      if (scopes && scopes.length > 0) {
        const userScopes = (user.app_metadata as NetlifyMetadata)?.roles || [];
        const hasScopes = scopes.every((scope) => userScopes.includes(scope));
        if (!hasScopes) {
          throw new Unauthorized('Insufficient scopes');
        }
      }

      return user;
    } catch (err) {
      throw new Unauthorized('Invalid token');
    }

    // User for public endpoints where usage is tracked
  } else if (securityName === 'user-token') {
    const userToken = getAuthCookie(req);
    if (!userToken) {
      // Allow unauthenticated users, we should create a new user in the request handler
      return null;
    }
    const userId = UserService.getUserIdFromToken(userToken);
    if (!userId) {
      return null;
    }
    return { id: userId };
  }

  throw new Unauthorized('Invalid security name');
}
