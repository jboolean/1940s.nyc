import type { Order } from 'prodigi-print-api';
import { AppDataSource } from '../../createConnection';
import MerchOrder from '../../entities/MerchOrder';
import MerchProvider from '../../enum/MerchProvider';
import * as MerchOrderService from '../merch/MerchOrderService';
import * as ProdigiService from './ProdigiService';
import prodigiOrderToFulfillmentState from './ProdigiToMerchOrderStatusMap';

export type CallbackResult =
  | 'processed'
  | 'ignored'
  // Nothing can be applied yet (the Prodigi order id is not recorded, or Prodigi cannot return the
  // order, as happens while it is held in the account's order edit window); Prodigi should retry.
  | 'retry';

export async function applyProdigiOrder(
  providerOrderId: string,
  prodigiOrder: Order
): Promise<void> {
  await MerchOrderService.onPrinterStatusChanged(
    MerchProvider.PRODIGI,
    providerOrderId,
    prodigiOrderToFulfillmentState(prodigiOrder)
  );
}

// Callbacks are not signed, so the order id in the body is only used to look the order up again
// from Prodigi with our API key; nothing else in the body is trusted.
// Returns false if Prodigi should retry the callback later.
export async function handleOrderCallback(
  prodigiOrderId: string,
  isShipmentEvent: boolean
): Promise<boolean> {
  const merchOrder = await AppDataSource.getRepository(MerchOrder).findOneBy({
    provider: MerchProvider.PRODIGI,
    providerOrderId: prodigiOrderId,
  });
  if (!merchOrder) {
    console.warn(
      'Prodigi callback for an order we do not know',
      prodigiOrderId
    );
    return true;
  }

  const prodigiOrder = await ProdigiService.getOrder(prodigiOrderId);
  if (!prodigiOrder) {
    return false;
  }

  await updateStatus(prodigiOrderId, prodigiOrder);

  if (isShipmentEvent) {
    // The latest dispatched shipment is the one this event is about. A shipment with no tracking
    // URL is skipped, so an untracked one sends no shipped email at all until the whole order is
    // Complete. Emailing it at dispatch would need a per-shipment marker, since the order's
    // emailed_tracking_url doubles as the record that this notification has gone out.
    const shipment = prodigiOrder.shipments
      .filter((s) => s.dispatchDate && s.tracking?.url)
      .sort((a, b) =>
        (a.dispatchDate ?? '').localeCompare(b.dispatchDate ?? '')
      )
      .pop();
    if (shipment?.tracking) {
      await MerchOrderService.onShipmentSent(
        MerchProvider.PRODIGI,
        prodigiOrderId,
        shipment.tracking.url
      );
    }
  }
  return true;
}
