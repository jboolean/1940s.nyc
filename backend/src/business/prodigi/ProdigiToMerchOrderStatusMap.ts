import type { Order } from 'prodigi-print-api';
import MerchOrderFulfillmentState from '../../enum/MerchOrderFulfillmentState';

// Prodigi orders have no draft state: an order is fulfilled as soon as it is created.
export default function prodigiOrderToFulfillmentState(
  order: Order
): MerchOrderFulfillmentState {
  const { stage, issues, details } = order.status;
  if (stage === 'Cancelled') {
    return MerchOrderFulfillmentState.CANCELED;
  }
  if (stage === 'Complete') {
    return MerchOrderFulfillmentState.FULFILLED;
  }
  if (
    details.downloadAssets === 'Error' ||
    details.printReadyAssetsPrepared === 'Error'
  ) {
    return MerchOrderFulfillmentState.FAILED;
  }
  if (issues.length > 0) {
    return MerchOrderFulfillmentState.ON_HOLD;
  }
  if (order.shipments.some((s) => s.dispatchDate)) {
    return MerchOrderFulfillmentState.PARTIAL;
  }
  if (details.downloadAssets === 'NotStarted') {
    return MerchOrderFulfillmentState.PENDING;
  }
  return MerchOrderFulfillmentState.IN_PROGRESS;
}
