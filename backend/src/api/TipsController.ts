/* eslint-disable camelcase */
import * as express from 'express';
import { InternalServerError } from 'http-errors';
import { Body, Post, Request, Route, Security } from 'tsoa';
import * as TipsService from '../business/tips/TipsService';
import { getUserFromRequestOrCreateAndSetCookie } from './auth/userAuthUtils';

import * as UserService from '../business/users/UserService';

type TipSessionRequest = {
  amount: number;
  successUrl: string;
  cancelUrl: string;
};

@Route('tips')
export class TipsController {
  @Security('user-token')
  @Post('/session')
  public async createTipSession(
    @Body() body: TipSessionRequest,
    @Request() req: express.Request
  ): Promise<{ sessionId: string }> {
    const { amount, successUrl, cancelUrl } = body;
    const userId = await getUserFromRequestOrCreateAndSetCookie(req);

    const user = await UserService.getUser(userId);

    try {
      const sessionId = await TipsService.createTipCheckoutSession({
        amountMinorUnits: amount,
        successUrl,
        cancelUrl,
        user,
      });

      return { sessionId: sessionId };
    } catch (err) {
      console.error('Failed to create session', err);
      throw new InternalServerError('Failed to create session');
    }
  }
}
