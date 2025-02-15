enum MerchOrderFulfillmentState {
  DRAFT = 'draft', // Order submitted to printer in draft mode
  PENDING = 'pending', // Awaiting acceptance for fulfillment
  ON_HOLD = 'on_hold', // Issue encountered; needs resolution before fulfillment
  FAILED = 'failed', // Fulfillment failed at the printer. This is not a terminal state. Action must be taken.
  CANCELED = 'canceled', // Order canceled by the printer
  IN_PROGRESS = 'in_progress', // Order is being fulfilled
  PARTIAL = 'partial', // Some items have shipped while others are pending
  FULFILLED = 'fulfilled', // Entire order has shipped
}

export default MerchOrderFulfillmentState;
