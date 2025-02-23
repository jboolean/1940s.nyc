import express from 'express';
import * as MerchOrderService from '../business/merch/MerchOrderService';
import PrintfulToMerchOrderStatusMap from '../business/merch/PrintfulToMerchOrderStatusMap';
import MerchProvider from '../enum/MerchProvider';
import {
  OrderUpdated,
  ShipmentSent,
  Webhook,
} from '../third-party/printful/client';
import PrintfulOrderStatus from '../third-party/printful/PrintfulOrderStatus';
const router = express.Router();

router.post<'/', unknown, unknown, Webhook, unknown>('/', async (req, res) => {
  const event = req.body;
  console.log('[Printful webhook]', event);
  switch (event.type) {
    case 'order_updated': {
      const order = (event as OrderUpdated).data.order;
      const newState =
        PrintfulToMerchOrderStatusMap[order.status as PrintfulOrderStatus];
      await MerchOrderService.onPrinterStatusChanged(
        MerchProvider.PRINTFUL,
        order.id,
        newState
      );

      break;
    }
    case 'shipment_sent': {
      const shipmentSentEvent = event as ShipmentSent;
      const shipment = shipmentSentEvent.data.shipment;
      const order = shipmentSentEvent.data.order;
      await MerchOrderService.onShipmentSent(
        MerchProvider.PRINTFUL,
        order.id,
        shipment.tracking_url
      );
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
