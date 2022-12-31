import * as Express from 'express';
import getNetfilyUser from '../../business/utils/getNetlifyUser';
import { Unauthorized } from 'http-errors';
import { UserData } from 'gotrue-js';

interface NetlifyMetadata {
  roles: string[];
}

export async function expressAuthentication(
  req: Express.Request,
  securityName: string,
  scopes?: string[]
): Promise<UserData | null> {
  if (securityName === 'netlify') {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Unauthorized('No auth header');
    }
    const token = authHeader.split(' ')[1];

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
  }

  throw new Unauthorized('Invalid security name');
}
