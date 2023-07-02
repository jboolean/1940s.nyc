/* eslint-disable camelcase */
import * as express from 'express';
import { InternalServerError } from 'http-errors';
import { Body, Post, Request, Route, Security } from 'tsoa';
import { getUserFromRequestOrCreateAndSetCookie } from './auth/userAuthUtils';
import stripe from './stripe';

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
            price_data: {
              currency: 'USD',
              product_data: {
                name: 'Tip for 1940s.nyc',
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId,
        },
        customer: stripeCustomerId,
        // History: Stripe used to always create a customer, then it started creating "guest customers" instead (annoying!). This is to force it to always create a customer which we can attach to the user in the webhook.
        customer_creation: hasExistingCustomer ? undefined : 'always',
        customer_email: hasExistingCustomer
          ? undefined
          : user?.email ?? undefined,
        payment_intent_data: {},
      });

      return { sessionId: session.id };
    } catch (err) {
      console.error('Failed to create session', err);
      throw new InternalServerError('Failed to create session');
    }
  }
}
