/* eslint-disable @typescript-eslint/camelcase */
import express from 'express';
import stripe from './stripe';
const router = express.Router();

type TipSessionRequest = {
  amount: number;
  successUrl: string;
  cancelUrl: string;
};

router.post('/session', async (req, res) => {
  const { amount, successUrl, cancelUrl } = req.body as TipSessionRequest;
  try {
    const session = await stripe.checkout.sessions.create({
      cancel_url: cancelUrl,
      mode: 'payment',
      payment_method_types: ['card'],
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
    });

    res.json({ sessionId: session.id });
  } catch (err) {
    console.error('Failed to create session', err);
    res.status(500).send();
  }
});

export default router;
