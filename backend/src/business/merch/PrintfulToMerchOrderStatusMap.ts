import MerchOrderState from '../../enum/MerchOrderState';
import PrintfulOrderStatus from '../../third-party/printful/PrintfulOrderStatus';

const PrintfulToMerchOrderStatusMap: Record<
  PrintfulOrderStatus,
  MerchOrderState
> = {
  [PrintfulOrderStatus.DRAFT]: MerchOrderState.FULFILLMENT_DRAFT, // Order created but not yet submitted for fulfillment.
  [PrintfulOrderStatus.PENDING]: MerchOrderState.FULFILLMENT_PENDING, // Order submitted, charged but not yet accepted.
  [PrintfulOrderStatus.FAILED]: MerchOrderState.FULFILLMENT_FAILED, // Order submission failed due to errors.
  [PrintfulOrderStatus.CANCELED]: MerchOrderState.FULFILLMENT_CANCELED, // Order was canceled and cannot be processed further.
  [PrintfulOrderStatus.IN_PROCESS]: MerchOrderState.FULFILLMENT_IN_PROGRESS, // Order is being fulfilled.
  [PrintfulOrderStatus.ON_HOLD]: MerchOrderState.FULFILLMENT_ON_HOLD, // Order encountered an issue requiring support resolution.
  [PrintfulOrderStatus.PARTIAL]: MerchOrderState.FULFILLMENT_PARTIAL, // Some items have shipped; others are still in process.
  [PrintfulOrderStatus.FULFILLED]: MerchOrderState.FULFILLED, // All items in the order have shipped successfully.
};

export default PrintfulToMerchOrderStatusMap;
