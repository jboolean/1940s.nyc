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
  // The merch order exists but has no Prodigi order id recorded yet; the callback should be retried.
  | 'retry';

async function applyProdigiOrder(
  providerOrderId: string,
  prodigiOrder: Order
): Promise<void> {
  await MerchOrderService.onPrinterStatusChanged(
    MerchProvider.PRODIGI,
    providerOrderId,
    prodigiOrderToFulfillmentState(prodigiOrder)
  );

  for (const shipment of prodigiOrder.shipments) {
    if (!shipment.dispatchDate) {
      continue;
    }
    await MerchOrderService.onShipmentSent(
      MerchProvider.PRODIGI,
      providerOrderId,
      {
        providerShipmentId: shipment.id,
        trackingUrl: shipment.tracking?.url,
        trackingNumber: shipment.tracking?.number,
        carrier: shipment.carrier.name,
      }
    );
  }
}

/**
 * Applies a Prodigi callback. The callback payload is never trusted: the order is
 * re-fetched from Prodigi with our API key and only that response is acted on.
 */
export async function handleOrderCallback(
  merchOrderId: number,
  callbackProdigiOrderId: string
): Promise<CallbackResult> {
  const merchOrder = await AppDataSource.getRepository(MerchOrder).findOneBy({
    id: merchOrderId,
    provider: MerchProvider.PRODIGI,
  });
  if (!merchOrder) {
    console.warn('Prodigi callback for unknown merch order', merchOrderId);
    return 'ignored';
  }
  if (!merchOrder.providerOrderId) {
    return 'retry';
  }
  if (merchOrder.providerOrderId !== callbackProdigiOrderId) {
    console.warn(
      'Prodigi callback order id does not match merch order',
      merchOrderId
    );
    return 'ignored';
  }

  const prodigiOrder = await ProdigiService.getOrder(callbackProdigiOrderId);
  if (!prodigiOrder) {
    console.warn('Prodigi order not found when re-fetching', merchOrderId);
    return 'ignored';
  }

  await applyProdigiOrder(merchOrder.providerOrderId, prodigiOrder);
  return 'processed';
}
