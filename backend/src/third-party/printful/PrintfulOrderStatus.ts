enum PrintfulOrderStatus {
  DRAFT = 'draft', // Order created but not yet submitted for fulfillment; can be edited or deleted.
  PENDING = 'pending', // Order submitted for fulfillment; charged but not yet accepted.
  FAILED = 'failed', // Order submission failed due to errors (address issues, missing printfiles, payment failure, etc.).
  CANCELED = 'canceled', // Order was canceled; cannot be processed further. If charged, cost is refunded.
  IN_PROCESS = 'inprocess', // Order is being fulfilled and can no longer be modified or canceled.
  ON_HOLD = 'onhold', // Order encountered an issue that requires Printful customer support resolution.
  PARTIAL = 'partial', // Some items in the order have shipped; remaining items are still in process.
  FULFILLED = 'fulfilled', // All items in the order have shipped successfully.
}

export default PrintfulOrderStatus;
