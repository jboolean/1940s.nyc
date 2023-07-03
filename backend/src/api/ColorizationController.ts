import * as express from 'express';
import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
} from 'tsoa';
import * as ColorService from '../business/color/ColorService';
import * as UserService from '../business/users/UserService';
import isProduction from '../business/utils/isProduction';
import { getUserFromRequestOrCreateAndSetCookie } from './auth/userAuthUtils';
import stripe from './stripe';

type BuyCreditsSessionRequest = {
  quantity: number;
  successUrl: string;
  cancelUrl: string;
};

const COLOR_CREDIT_PRICE_ID = isProduction()
  ? 'price_TODO' // TODO
  : 'price_1NPpdrFCLBtNZLVlpl2852ha';

const MIN_QUANTITY = 20;

@Route('colorization')
export class ColorizationController extends Controller {
  @Security('user-token')
  @Get('/colorized/{identifier}')
  public async getColorizedImage(
    @Path('identifier') identifier: string,
    @Request() req: express.Request
  ): Promise<void> {
    const res = req.res;
    if (!res) {
      throw new Error('No response object');
    }

    const userId = await getUserFromRequestOrCreateAndSetCookie(req);

    const url = await ColorService.getColorizedImage(identifier, userId);
    res.redirect(301, url);
  }

  @Security('user-token')
  @Get('/billing/balance')
  public async getBalance(
    @Request() req: express.Request
  ): Promise<{ creditBalance: number }> {
    const userId = await getUserFromRequestOrCreateAndSetCookie(req);
    const balance = await ColorService.getBalance(userId);
    return { creditBalance: balance };
  }

  @Security('user-token')
  @Post('/billing/buy-credits/sessions')
  public async createBuyCreditsSession(
    @Body() body: BuyCreditsSessionRequest,
    @Request() req: express.Request
  ): Promise<{ sessionId: string }> {
    const { quantity, successUrl, cancelUrl } = body;
    const userId = await getUserFromRequestOrCreateAndSetCookie(req);

    const user = await UserService.getUser(userId);

    const stripeCustomerId: string | undefined =
      user?.stripeCustomerId ?? undefined;
    const hasExistingCustomer = !!stripeCustomerId;

    try {
      const session = await stripe.checkout.sessions.create({
        cancel_url: cancelUrl,
        mode: 'payment',
        success_url: successUrl,
        line_items: [
          {
            price: COLOR_CREDIT_PRICE_ID,
            quantity,
            adjustable_quantity: {
              enabled: true,
              minimum: MIN_QUANTITY,
            },
          },
        ],
        metadata: {
          userId,
        },
        customer: stripeCustomerId,
        customer_creation: hasExistingCustomer ? undefined : 'always',
        customer_email: hasExistingCustomer
          ? undefined
          : user?.email ?? undefined,
        payment_intent_data: {
          setup_future_usage: 'on_session',
        },
      });

      return { sessionId: session.id };
    } catch (err) {
      console.error('Error creating Stripe session', err);
      throw err;
    }
  }
}
