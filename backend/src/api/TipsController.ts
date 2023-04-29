/* eslint-disable camelcase */
import * as express from 'express';
import { InternalServerError } from 'http-errors';
import { Body, Post, Request, Route, Security } from 'tsoa';
import { getUserFromRequestOrCreateAndSetCookie } from './auth/userAuthUtils';
import stripe from './stripe';

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
      });

      return { sessionId: session.id };
    } catch (err) {
      throw new InternalServerError('Failed to create session');
    }
  }
}
