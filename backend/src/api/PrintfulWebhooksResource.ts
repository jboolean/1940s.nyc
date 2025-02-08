import express from 'express';
import { Webhook } from '../third-party/printful/client';
const router = express.Router();

router.post<'/', unknown, unknown, Webhook, unknown>('/', (req, res) => {
  const event = req.body;
  switch (event.type) {
    default: {
      console.log('Unhandled Printful webhook event', event);
      break;
    }
  }
  res.status(200).send();
});

export default router;
