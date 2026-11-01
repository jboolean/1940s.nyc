import { Body, Get, Post, Request, Route, Security } from '@tsoa/runtime';
import * as express from 'express';
import { HttpError, InternalServerError } from 'http-errors';
import { getUserFromRequestOrCreateAndSetCookie } from './auth/userAuthUtils';

import * as MerchCheckoutService from '../business/merch/MerchCheckoutService';
import { PRINT_VARIANTS } from '../business/merch/merchCatalog';
import * as ProductRegistry from '../business/merch/ProductRegistry';
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

interface PrintCartItem {
  photoIdentifier: string;
  variant: MerchInternalVariant;
  quantity: number;
  colorize: boolean;
}

interface PrintCartSessionRequest {
  successUrl: string;
  cancelUrl: string;
  items: PrintCartItem[];
}

interface PrintProductApiResponse {
  variant: MerchInternalVariant;
  label: string;
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
      const { successUrl, cancelUrl, variant, quantity } = body;
      const { photoIdentifier, colorize } = body;
      return await MerchCheckoutService.createMerchCheckoutSession({
        successUrl,
        cancelUrl,
        user,
        items: [{ variant, quantity, print: { photoIdentifier, colorize } }],
      });
    } catch (err) {
      if (err instanceof HttpError) {
        throw err;
      }
      console.error('Failed to create print checkout session', err);
      throw new InternalServerError('Failed to create session');
    }
  }

  @Security('user-token')
  @Post('/cart-session')
  public async createPrintCartSession(
    @Body() body: PrintCartSessionRequest,
    @Request() req: express.Request
  ): Promise<{ sessionId: string; url: string }> {
    const userId = await getUserFromRequestOrCreateAndSetCookie(req);
    const user = await UserService.getUser(userId);

    try {
      const { successUrl, cancelUrl, items } = body;
      return await MerchCheckoutService.createMerchCheckoutSession({
        successUrl,
        cancelUrl,
        user,
        items: items.map(
          ({ variant, quantity, photoIdentifier, colorize }) => ({
            variant,
            quantity,
            print: { photoIdentifier, colorize },
          })
        ),
      });
    } catch (err) {
      if (err instanceof HttpError) {
        throw err;
      }
      console.error('Failed to create print cart checkout session', err);
      throw new InternalServerError('Failed to create session');
    }
  }

  @Get('/available-products')
  public async getAvailableProducts(): Promise<PrintProductApiResponse[]> {
    return ProductRegistry.getAvailableProducts(PRINT_VARIANTS);
  }
}
