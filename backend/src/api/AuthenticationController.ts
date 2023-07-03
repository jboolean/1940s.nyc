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
import LoginOutcome from '../enum/LoginOutcome';
import { setAuthCookie } from './auth/authCookieUtils';
import { getUserFromRequestOrCreateAndSetCookie } from './auth/userAuthUtils';
import { Email } from './CommonApiTypes';

type LoginRequest = {
  // Email the user wants to use
  requestedEmail: Email;

  // If login involes a link, the frontend path to return to after login
  returnToPath: string;
};

type LoginResponse = {
  outcome: LoginOutcome;
};

@Route('authentication')
export class AuthenticationController extends Controller {
  @Security('user-token')
  @Post('/request-login')
  public async requestLogin(
    @Body() loginRequest: LoginRequest,
    @Request() req: express.Request
  ): Promise<LoginResponse> {
    const userId = await getUserFromRequestOrCreateAndSetCookie(req);
    const { requestedEmail, returnToPath } = loginRequest;
    const ipAddress = req.ip;
    const apiBase = `${req.protocol}://${req.hostname}`;
    const result = await UserService.processLoginRequest(
      requestedEmail,
      userId,
      ipAddress,
      apiBase,
      returnToPath
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
  public loginWithMagicLink(
    @Query('token') magicToken: string,
    @Request() req: express.Request,
    @Query('returnToPath') returnToPath?: string
  ): void {
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

    const permenantToken = UserService.createUserToken(userId);

    setAuthCookie(permenantToken, res);

    const redirectUrl: URL = new URL(
      returnToPath || '/',
      process.env.FRONTEND_BASE_URL
    );

    res.redirect(redirectUrl.toString());
  }
}