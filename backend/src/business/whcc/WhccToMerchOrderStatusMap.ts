import MerchOrderFulfillmentState from '../../enum/MerchOrderFulfillmentState';
import type { Submission } from './whccApi';

// A submission can split into several WHCC orders (orders[]).
export default function whccSubmissionToFulfillmentState(
  submission: Submission
): MerchOrderFulfillmentState {
  switch (submission.status) {
    case 'failed':
    case 'partially_failed':
      return MerchOrderFulfillmentState.FAILED;
    case 'canceled':
      return MerchOrderFulfillmentState.CANCELED;
    case 'staged':
    case 'submitting':
      return MerchOrderFulfillmentState.PENDING;
    case 'placed':
    case 'shipped':
      break;
  }

  const orders = (submission.orders ?? []).filter(
    (o) => o.status !== 'order_canceled'
  );
  if (!submission.orders?.length) {
    return MerchOrderFulfillmentState.PENDING;
  }
  if (!orders.length) {
    return MerchOrderFulfillmentState.CANCELED;
  }
  const shipped = orders.filter((o) => o.status === 'order_shipped').length;
  if (shipped === orders.length) {
    return MerchOrderFulfillmentState.FULFILLED;
  }
  if (shipped > 0) {
    return MerchOrderFulfillmentState.PARTIAL;
  }
  if (orders.every((o) => o.status === 'order_placed')) {
    return MerchOrderFulfillmentState.PENDING;
  }
  return MerchOrderFulfillmentState.IN_PROGRESS;
}
