import { Body, Get, Post, Request, Route, Security } from '@tsoa/runtime';
import * as express from 'express';
import { HttpError, InternalServerError } from 'http-errors';
import { getUserFromRequestOrCreateAndSetCookie } from './auth/userAuthUtils';

import * as PrintCheckoutService from '../business/prodigi/PrintCheckoutService';
import * as UserService from '../business/users/UserService';
import MerchInternalVariant from '../enum/MerchInternalVariant';

interface PrintSessionRequest {
  successUrl: string;
  cancelUrl: string;
  photoIdentifier: string;
  variant: MerchInternalVariant;
  quantity: number;
  colorize: boolean;
}

interface PrintProductApiResponse {
  variant: MerchInternalVariant;
  label: string;
  framed: boolean;
  priceAmount: number;
}

@Route('print-checkout')
export class PrintCheckoutController {
  @Security('user-token')
  @Post('/session')
  public async createPrintSession(
    @Body() body: PrintSessionRequest,
    @Request() req: express.Request
  ): Promise<{ sessionId: string; url: string }> {
    const userId = await getUserFromRequestOrCreateAndSetCookie(req);
    const user = await UserService.getUser(userId);

    try {
      return await PrintCheckoutService.createPrintCheckoutSession({
        ...body,
        user,
      });
    } catch (err) {
      if (err instanceof HttpError) {
        throw err;
      }
      console.error('Failed to create print checkout session', err);
      throw new InternalServerError('Failed to create session');
    }
  }

  @Get('/available-products')
  public async getAvailableProducts(): Promise<PrintProductApiResponse[]> {
    return PrintCheckoutService.getAvailablePrintProducts();
  }
}
