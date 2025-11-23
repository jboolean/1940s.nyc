/* eslint-disable camelcase */
import { Body, Get, Post, Request, Route, Security } from '@tsoa/runtime';
import * as express from 'express';
import { HttpError, InternalServerError } from 'http-errors';
import { getUserFromRequestOrCreateAndSetCookie } from './auth/userAuthUtils';

import * as MerchCheckoutService from '../business/merch/MerchCheckoutService';
import * as ProductRegistry from '../business/merch/ProductRegistry';
import * as UserService from '../business/users/UserService';
import MerchInternalVariant from '../enum/MerchInternalVariant';

type MerchSessionRequest = {
  successUrl: string;
  cancelUrl: string;
  items: { variant: MerchInternalVariant; quantity: number }[];
};

interface MerchProductApiResponse {
  variant: MerchInternalVariant;
  priceAmount: number;
}
@Route('merch-checkout')
export class MerchCheckoutController {
  @Security('user-token')
  @Post('/session')
  public async createMerchSession(
    @Body() body: MerchSessionRequest,
    @Request() req: express.Request
  ): Promise<{ sessionId: string; url: string }> {
    const { successUrl, cancelUrl, items } = body;
    const userId = await getUserFromRequestOrCreateAndSetCookie(req);
    const user = await UserService.getUser(userId);

    try {
      const result = await MerchCheckoutService.createMerchCheckoutSession({
        successUrl,
        cancelUrl,
        user,
        items,
      });

      return result;
    } catch (err) {
      if (err instanceof HttpError) {
        throw err;
      }
      console.error('Failed to create session', err);
      throw new InternalServerError('Failed to create session');
    }
  }

  @Get('/available-products')
  public async getAvailableProducts(): Promise<MerchProductApiResponse[]> {
    return await ProductRegistry.getAllAvailableProducts().then((products) =>
      products.map((product) => ({
        variant: product.variant,
        priceAmount: product.priceAmount,
      }))
    );
  }
}
