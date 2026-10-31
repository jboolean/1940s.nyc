enum MerchItemState {
  PURCHASED = 'purchased', // Item purchased; may need customization
  CUSTOMIZED = 'customized', // Customization complete
  READY_FOR_FULFILLMENT = 'ready_for_fulfillment', // Ready to be added to an order
  ADDED_TO_ORDER = 'added_to_order', // Item has been added to an order
}
export default MerchItemState;
