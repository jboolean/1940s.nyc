enum MerchItemState {
  PURCHASED = 'purchased', // Item purchased; may need customization
  CUSTOMIZED = 'customized', // Customization complete
  AWAITING_PRINTFILE = 'awaiting_printfile', // Print item purchased and customized; its print file has not been generated yet
  PRINTFILE_FAILED = 'printfile_failed', // Print file generation kept failing; needs a person to look and reset the item to awaiting_printfile
  READY_FOR_FULFILLMENT = 'ready_for_fulfillment', // Ready to be added to an order
  ADDED_TO_ORDER = 'added_to_order', // Item has been added to an order
}
export default MerchItemState;
