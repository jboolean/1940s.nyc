enum MerchItemState {
  PURCHASED = 'purchased', // Item purchased; may need customization
  CUSTOMIZED = 'customized', // Customization complete
  PRINTFILE_FAILED = 'printfile_failed', // Print file generation kept failing; needs a person to look and reset the item to customized
  READY_FOR_FULFILLMENT = 'ready_for_fulfillment', // Ready to be added to an order
  ADDED_TO_ORDER = 'added_to_order', // Item has been added to an order
}
export default MerchItemState;
