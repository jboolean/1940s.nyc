import express from 'express';
import { updateLocalStatus } from '../business/merch/PrintfulService';
import { OrderUpdated, Webhook } from '../third-party/printful/client';
import PrintfulOrderStatus from '../third-party/printful/PrintfulOrderStatus';
const router = express.Router();

router.post<'/', unknown, unknown, Webhook, unknown>('/', async (req, res) => {
  const event = req.body;
  switch (event.type) {
    case 'order_updated': {
      const order = (event as OrderUpdated).data.order;
      await updateLocalStatus(order.id, order.status as PrintfulOrderStatus);

      break;
    }
    default: {
      console.log('Unhandled Printful webhook event', event);
      break;
    }
  }
  res.status(200).send();
});

export default router;
