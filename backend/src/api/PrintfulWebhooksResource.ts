import express from 'express';
import * as PrintfulCallbackService from '../business/merch/PrintfulCallbackService';
import {
  OrderUpdated,
  ShipmentSent,
  Webhook,
} from '../third-party/printful/client';
const router = express.Router();

router.post<'/', unknown, unknown, Webhook, unknown>('/', async (req, res) => {
  const event = req.body;
  console.log('[Printful webhook]', event);
  switch (event.type) {
    case 'order_updated':
    case 'shipment_sent': {
      const orderId = (event as OrderUpdated | ShipmentSent).data?.order?.id;
      if (typeof orderId !== 'number') {
        console.warn('Printful webhook without an order id', event);
        break;
      }
      try {
        const ok = await PrintfulCallbackService.handleOrderWebhook(
          orderId,
          event.type === 'shipment_sent'
        );
        res.status(ok ? 200 : 503).send();
      } catch (e) {
        console.error('[Printful webhook] Failed to process webhook', e);
        res.status(503).send();
      }
      return;
    }
    default: {
      console.log('Unhandled Printful webhook event', event);
      break;
    }
  }
  res.status(200).send();
});

export default router;
