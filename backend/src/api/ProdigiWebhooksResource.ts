import express from 'express';
import { parseCallbackEvent } from 'prodigi-print-api';
import * as ProdigiCallbackService from '../business/prodigi/ProdigiCallbackService';

const router = express.Router();

// Accept the body whatever Content-Type Prodigi sends.
router.use(express.json({ type: () => true }));

router.post('/', async (req, res) => {
  try {
    const event = parseCallbackEvent(req.body);
    const ok = await ProdigiCallbackService.handleOrderCallback(
      event.order.id,
      event.kind === 'order.shipments.shipment'
    );
    res.status(ok ? 200 : 503).send();
  } catch (e) {
    console.error('[Prodigi webhook] Failed to process callback', e);
    res.status(503).send();
  }
});

export default router;
