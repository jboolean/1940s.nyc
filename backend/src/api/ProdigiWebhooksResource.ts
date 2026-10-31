import express from 'express';
import { parseCallbackEvent } from 'prodigi-print-api';
import * as ProdigiCallbackService from '../business/prodigi/ProdigiCallbackService';

const router = express.Router();

// Accept the body whatever Content-Type Prodigi sends.
router.use(express.json({ type: () => true }));

router.post('/', async (req, res) => {
  let event: ReturnType<typeof parseCallbackEvent>;
  try {
    event = parseCallbackEvent(req.body);
  } catch (e) {
    // Retrying a payload we cannot parse will never help, so do not answer with a
    // status that asks Prodigi to send it again.
    console.error('[Prodigi webhook] Ignoring a callback we cannot parse', e);
    res.status(400).send();
    return;
  }
  try {
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
