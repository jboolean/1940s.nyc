/* eslint-disable camelcase */
import * as express from 'express';
import { InternalServerError } from 'http-errors';
import { Body, Get, Post, Request, Route, Security } from 'tsoa';
import * as TipsService from '../business/tips/TipsService';
import { getUserFromRequestOrCreateAndSetCookie } from './auth/userAuthUtils';

import * as GiftRegistry from '../business/tips/GiftRegistry';
import * as UserService from '../business/users/UserService';
import TipFrequency from '../enum/TipFrequency';

type TipSessionRequest = {
  amount: number;
  successUrl: string;
  cancelUrl: string;
  frequency?: TipFrequency;
  gift?: GiftRegistry.Gift;
};

interface GiftApiResponse {
  gift: GiftRegistry.Gift;
  minimumAmount: number;
  frequency: TipFrequency;
}
@Route('tips')
export class TipsController {
  @Security('user-token')
  @Post('/session')
  public async createTipSession(
    @Body() body: TipSessionRequest,
    @Request() req: express.Request
  ): Promise<{ sessionId: string }> {
    const {
      amount,
      successUrl,
      cancelUrl,
      gift,
      frequency = TipFrequency.ONCE,
    } = body;
    const userId = await getUserFromRequestOrCreateAndSetCookie(req);

    const user = await UserService.getUser(userId);

    try {
      const sessionId = await TipsService.createTipCheckoutSession({
        amountMinorUnits: amount,
        successUrl,
        cancelUrl,
        user,
        frequency,
        gift,
      });

      return { sessionId: sessionId };
    } catch (err) {
      console.error('Failed to create session', err);
      throw new InternalServerError('Failed to create session');
    }
  }

  @Get('/gifts')
  public getGifts(): GiftApiResponse[] {
    return GiftRegistry.getAllAvailableGifts().map((gift) => {
      return {
        gift: gift.gift,
        minimumAmount: gift.minimumAmount,
        frequency: gift.frequency,
      };
    });
  }
}
