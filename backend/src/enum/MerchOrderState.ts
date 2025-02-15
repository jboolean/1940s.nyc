enum MerchOrderState {
  BUILDING = 'building', // Order is in draft, items are being added
  PENDING_SUBMISSION = 'pending_submission', // Order is ready to be submitted to the printer
  SUBMITTED_FOR_FULFILLMENT = 'submitted_for_fulfillment', // Order has been submitted to the printer, see fulfillment state
  CANCELED = 'canceled', // Order has been canceled. May have been before or after submission, due to failure or not.
}

export default MerchOrderState;
