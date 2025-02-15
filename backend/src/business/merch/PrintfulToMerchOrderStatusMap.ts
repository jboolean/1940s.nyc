import MerchOrderFulfillmentState from '../../enum/MerchOrderFulfillmentState';
import PrintfulOrderStatus from '../../third-party/printful/PrintfulOrderStatus';

const PrintfulToMerchOrderStatusMap: Record<
  PrintfulOrderStatus,
  MerchOrderFulfillmentState
> = {
  [PrintfulOrderStatus.DRAFT]: MerchOrderFulfillmentState.DRAFT, // Order created but not yet submitted for fulfillment.
  [PrintfulOrderStatus.PENDING]: MerchOrderFulfillmentState.PENDING, // Order submitted, charged but not yet accepted.
  [PrintfulOrderStatus.FAILED]: MerchOrderFulfillmentState.FAILED, // Order submission failed due to errors.
  [PrintfulOrderStatus.CANCELED]: MerchOrderFulfillmentState.CANCELED, // Order was canceled and cannot be processed further.
  [PrintfulOrderStatus.IN_PROCESS]: MerchOrderFulfillmentState.IN_PROGRESS, // Order is being fulfilled.
  [PrintfulOrderStatus.ON_HOLD]: MerchOrderFulfillmentState.ON_HOLD, // Order encountered an issue requiring support resolution.
  [PrintfulOrderStatus.PARTIAL]: MerchOrderFulfillmentState.PARTIAL, // Some items have shipped; others are still in process.
  [PrintfulOrderStatus.FULFILLED]: MerchOrderFulfillmentState.FULFILLED, // All items in the order have shipped successfully.
};

export default PrintfulToMerchOrderStatusMap;
