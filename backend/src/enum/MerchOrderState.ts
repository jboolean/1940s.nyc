enum MerchOrderState {
  BUILDING = 'building', // Items are still in early states, not yet submitted
  FULFILLMENT_DRAFT = 'fulfillment_draft', // Order submitted to printer in draft mode
  FULFILLMENT_PENDING = 'fulfillment_pending', // Awaiting acceptance for fulfillment
  FULFILLMENT_ON_HOLD = 'fulfillment_on_hold', // Issue encountered; needs resolution before fulfillment
  FULFILLMENT_FAILED = 'fulfillment_failed', // Fulfillment failed at the printer. This is not a terminal state. Action must be taken.
  FULFILLMENT_CANCELED = 'fulfillment_canceled', // Order canceled by the printer
  FULFILLMENT_IN_PROGRESS = 'fulfillment_in_progress', // Order is being fulfilled
  FULFILLMENT_PARTIAL = 'fulfillment_partial', // Some items have shipped while others are pending
  FULFILLED = 'fulfilled', // Entire order has shipped
  CANCELED = 'canceled',
}

export default MerchOrderState;
