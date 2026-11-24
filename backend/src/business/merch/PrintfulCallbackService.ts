import { AppDataSource } from '../../createConnection';
import MerchOrder from '../../entities/MerchOrder';
import MerchProvider from '../../enum/MerchProvider';
import PrintfulOrderStatus from '../../third-party/printful/PrintfulOrderStatus';
import { getOrder, getShipments } from '../utils/printfulApi';
import * as MerchOrderService from './MerchOrderService';
import PrintfulToMerchOrderStatusMap from './PrintfulToMerchOrderStatusMap';

// Webhooks are not signed, so the order id in the body is only used to look the order up again
// from Printful with our API key; nothing else in the body is trusted.
// Returns false if Printful should retry the webhook later.
export async function handleOrderWebhook(
  printfulOrderId: number,
  isShipmentEvent: boolean
): Promise<boolean> {
  const providerOrderId = String(printfulOrderId);
  const merchOrder = await AppDataSource.getRepository(MerchOrder).findOneBy({
    provider: MerchProvider.PRINTFUL,
    providerOrderId,
  });
  if (!merchOrder) {
    console.warn(
      'Printful webhook for an order we do not know',
      printfulOrderId
    );
    return true;
  }

  const orderResp = await getOrder({ path: { order_id: printfulOrderId } });
  const printfulOrder = orderResp.data?.data;
  if (orderResp.status === 404) {
    console.warn(
      'Printful webhook for an order Printful does not have',
      printfulOrderId
    );
    return true;
  }
  if (!printfulOrder) {
    console.error(
      'Failed to fetch Printful order',
      printfulOrderId,
      orderResp.error
    );
    return false;
  }

  await MerchOrderService.onPrinterStatusChanged(
    MerchProvider.PRINTFUL,
    providerOrderId,
    PrintfulToMerchOrderStatusMap[printfulOrder.status as PrintfulOrderStatus]
  );

  if (isShipmentEvent) {
    const shipmentsResp = await getShipments({
      path: { order_id: printfulOrderId },
    });
    if (!shipmentsResp.data) {
      console.error(
        'Failed to fetch Printful shipments',
        printfulOrderId,
        shipmentsResp.error
      );
      return false;
    }
    const shipment = shipmentsResp.data.data
      .filter((s) => s.shipped_at && s.tracking_url)
      .sort((a, b) => (a.shipped_at ?? '').localeCompare(b.shipped_at ?? ''))
      .pop();
    if (shipment?.tracking_url) {
      await MerchOrderService.onShipmentSent(
        MerchProvider.PRINTFUL,
        providerOrderId,
        shipment.tracking_url
      );
    }
  }
  return true;
}
