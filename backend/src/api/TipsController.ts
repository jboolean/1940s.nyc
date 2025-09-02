/* eslint-disable camelcase */
import { Body, Get, Post, Request, Route, Security } from '@tsoa/runtime';
import * as express from 'express';
import { HttpError, InternalServerError } from 'http-errors';
import * as TipsService from '../business/tips/TipsService';
import { getUserFromRequestOrCreateAndSetCookie } from './auth/userAuthUtils';

import * as GiftRegistry from '../business/tips/GiftRegistry';
import { Gift } from '../business/tips/GiftRegistry';
import * as UserService from '../business/users/UserService';
import TipFrequency from '../enum/TipFrequency';

type TipSessionRequest = {
  amount: number;
  successUrl: string;
  cancelUrl: string;
  frequency?: TipFrequency;
  gift?: Gift;
};

type CustomerPortalRequest = {
  returnUrl: string;
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
      if (err instanceof HttpError) {
        throw err;
      }
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

  @Security('user-token')
  @Post('/customer-portal-session')
  public async createCustomerPortalSession(
    @Body() { returnUrl }: CustomerPortalRequest,
    @Request() req: express.Request
  ): Promise<{ url: string }> {
    const userId = await getUserFromRequestOrCreateAndSetCookie(req);

    const user = await UserService.getUser(userId);
    const url = await TipsService.createCustomerPortalSession(user, returnUrl);

    return { url: url };
  }
}
