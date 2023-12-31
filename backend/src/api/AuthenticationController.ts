import * as express from 'express';
import { BadRequest, Unauthorized } from 'http-errors';
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
import { setAuthCookie } from './auth/authCookieUtils';
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
};

type LoginResponse = {
  outcome: LoginOutcome;
};

type UserResponse = {
  email: string | null;
};

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
    const { requestedEmail, returnToPath, requireVerifiedEmail } = loginRequest;
    const ipAddress = req.ip;
    const apiBase = `${req.protocol}://${required(req.get('host'), 'host')}`;
    const result = await UserService.processLoginRequest(
      requestedEmail,
      userId,
      ipAddress,
      apiBase,
      returnToPath,
      requireVerifiedEmail
    );

    console.log('Login requested', {
      requestedEmail,
      result,
    });

    return { outcome: result };
  }

  /**
   * We take the temporary token from the query string and set a permenant token in a cookie.
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
      throw new Unauthorized('The link contains in invalid or expired token');
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
}
