enum MerchItemState {
  PURCHASED = 'purchased', // Item purchased; may need customization
  CUSTOMIZED = 'customized', // Customization complete
  READY_FOR_FULFILLMENT = 'ready_for_fulfillment', // Ready to be submitted as part of an order
}
export default MerchItemState;
