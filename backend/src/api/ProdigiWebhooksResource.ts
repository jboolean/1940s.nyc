import express from 'express';
import { parseCallbackEvent } from 'prodigi-print-api';
import * as ProdigiCallbackService from '../business/prodigi/ProdigiCallbackService';
import { isValidCallbackToken } from '../business/prodigi/prodigiCallbackAuth';

const router = express.Router();

// Prodigi does not sign callbacks. The path carries a per-order token, and the handler
// re-fetches the order from Prodigi rather than trusting the body.
router.post<'/:merchOrderId/:token', { merchOrderId: string; token: string }>(
  '/:merchOrderId/:token',
  async (req, res) => {
    const merchOrderId = Number(req.params.merchOrderId);
    if (
      !Number.isInteger(merchOrderId) ||
      !isValidCallbackToken(merchOrderId, req.params.token)
    ) {
      res.status(401).send();
      return;
    }

    let prodigiOrderId: string;
    try {
      prodigiOrderId = parseCallbackEvent(req.body).order.id;
    } catch (e) {
      console.warn('[Prodigi webhook] Unparseable callback', e);
      res.status(400).send();
      return;
    }

    const result = await ProdigiCallbackService.handleOrderCallback(
      merchOrderId,
      prodigiOrderId
    );
    res.status(result === 'retry' ? 503 : 200).send();
  }
);

export default router;
