import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
} from '@tsoa/runtime';
import * as express from 'express';
import { BadRequest } from 'http-errors';
import Stripe from 'stripe';
import * as ColorService from '../business/color/ColorService';
import * as UserService from '../business/users/UserService';
import isProduction from '../business/utils/isProduction';
import required from '../business/utils/required';
import stripe from '../third-party/stripe';
import { getUserFromRequestOrCreateAndSetCookie } from './auth/userAuthUtils';

type BuyCreditsSessionRequest = {
  quantity: number;
  successUrl: string;
  cancelUrl: string;
};

const COLOR_CREDIT_PRODUCT_ID = isProduction()
  ? 'prod_OCXuxXcQOP3N4j'
  : 'prod_OCE62CeqBcpuxW';

const MIN_QUANTITY = 20;
const MAX_QUANTITY = 2000;

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

  @Get('/billing/price')
  public async getPrice(): Promise<{ unitAmount: number }> {
    const product = await stripe.products.retrieve(COLOR_CREDIT_PRODUCT_ID, {
      expand: ['default_price'],
    });
    const price = required(
      product.default_price,
      'product.default_price'
    ) as Stripe.Price;
    const unitAmount = required(price.unit_amount, 'price.unit_amount');
    return { unitAmount };
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

    // purchasing is only allowed on named accounts, otherwise credits could be lost
    if (!user || user.isAnonymous) {
      throw new BadRequest(
        'You must be logged into an account with an email address to buy credits'
      );
    }

    const stripeCustomerId: string | undefined =
      user?.stripeCustomerId ?? undefined;
    const hasExistingCustomer = !!stripeCustomerId;

    const product = await stripe.products.retrieve(COLOR_CREDIT_PRODUCT_ID);

    try {
      const session = await stripe.checkout.sessions.create({
        cancel_url: cancelUrl,
        mode: 'payment',
        success_url: successUrl,
        line_items: [
          {
            price: product.default_price as string,
            quantity,
            adjustable_quantity: {
              enabled: true,
              minimum: MIN_QUANTITY,
              maximum: MAX_QUANTITY,
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
