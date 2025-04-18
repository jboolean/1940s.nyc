import * as express from 'express';
import { BadRequest } from 'http-errors';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  Route,
  Security,
} from 'tsoa';
import * as UserService from '../business/users/UserService';
import required from '../business/utils/required';
import LoginOutcome from '../enum/LoginOutcome';
import { clearAuthCookie, setAuthCookie } from './auth/authCookieUtils';
import { getUserFromRequestOrCreateAndSetCookie } from './auth/userAuthUtils';
import { Email } from './CommonApiTypes';

type LoginRequest = {
  // Email the user wants to use
  requestedEmail: Email;

  // If login involes a link, the frontend path to return to after login
  returnToPath?: string;

  // If true, sends an email even if user is already logged in, if email is not verified
  // Use before sensitive actions
  // Remember to check isEmailVerified before performing sensitive actions
  requireVerifiedEmail?: boolean;

  // If the user is already logged in, and the email is different, should we update the email on a named account?
  newEmailBehavior?: 'update' | 'reject';
};

type LoginResponse = {
  outcome: LoginOutcome;
};

type UserResponse = {
  email: string | null;
};

const getApiBase = (req: express.Request): string =>
  `${req.protocol}://${required(req.get('host'), 'host')}`;

@Route('authentication')
export class AuthenticationController extends Controller {
  @Security('user-token')
  @Get('/me')
  public async getMe(@Request() req: express.Request): Promise<UserResponse> {
    const userId = await getUserFromRequestOrCreateAndSetCookie(req);
    const user = await UserService.getUser(userId);
    return { email: user.email };
  }

  @Security('user-token')
  @Post('/request-login')
  public async requestLogin(
    @Body() loginRequest: LoginRequest,
    @Request() req: express.Request
  ): Promise<LoginResponse> {
    const userId = await getUserFromRequestOrCreateAndSetCookie(req);
    const {
      requestedEmail,
      returnToPath,
      requireVerifiedEmail,
      newEmailBehavior,
    } = loginRequest;
    const apiBase = getApiBase(req);
    const result = await UserService.processLoginRequest(
      requestedEmail,
      userId,
      apiBase,
      returnToPath,
      requireVerifiedEmail,
      newEmailBehavior
    );

    console.log('Login requested', {
      requestedEmail,
      result,
    });

    return { outcome: result };
  }

  /**
   * We take the temporary token from the query string and set a permanent token in a cookie.
   * @param magicToken A temporary token sent in a magic link
   * @param res
   * @param returnToPath The path to attach to the frontend base URL and redirect to after login
   */
  @Get('/login-with-magic-link')
  public async loginWithMagicLink(
    @Query('token') magicToken: string,
    @Request() req: express.Request,
    @Query('returnToPath') returnToPath?: string
  ): Promise<void> {
    const res = req.res;
    if (!res) {
      throw new Error('No response object');
    }

    if (!magicToken) {
      throw new BadRequest('No token provided');
    }

    const userId = UserService.getUserIdFromToken(magicToken);

    if (!userId) {
      res.status(401).type('text/plain');

      // If it's just expired, send a new link
      const userIdExpired = UserService.getUserIdFromToken(magicToken, {
        ignoreExpiration: true,
      });
      if (typeof userIdExpired !== 'undefined') {
        await UserService.sendMagicLinkToUser(
          userIdExpired,
          getApiBase(req),
          returnToPath
        );
        res.send('This link has expired. A new one has been emailed to you.');
        return;
      }
      res.send('This link contains an invalid token');
      return;
    }

    await UserService.markEmailVerified(userId);

    const permenantToken = UserService.createUserToken(userId);

    setAuthCookie(permenantToken, res);

    console.log('Logged in with magic link', {
      userId,
    });

    const redirectUrl: URL = new URL(
      returnToPath || '/',
      process.env.FRONTEND_BASE_URL
    );

    res.redirect(redirectUrl.toString());
  }

  @Post('/logout')
  public logout(@Request() req: express.Request): void {
    clearAuthCookie(required(req.res, 'res'));
  }
}
