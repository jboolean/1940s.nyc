// All these copied from the backend

export enum MerchInternalVariant {
  TOTE_BAG_SMALL = 'tote-bag-small',
}

interface ToteBagCustomizationOptions {
  variant: MerchInternalVariant.TOTE_BAG_SMALL;
  lat: number;
  lng: number;
  style: 'outline' | 'solid';
  foregroundColor: 'red' | 'green' | 'creme' | 'dark';
  backgroundColor: 'red' | 'green' | 'creme' | 'dark';
}

export type MerchCustomizationOptions = ToteBagCustomizationOptions;

export enum MerchOrderState {
  BUILDING = 'building', // Order is in draft, items are being added
  PENDING_SUBMISSION = 'pending_submission', // Order is ready to be submitted to the printer
  SUBMITTED_FOR_FULFILLMENT = 'submitted_for_fulfillment', // Order has been submitted to the printer, see fulfillment state
  CANCELED = 'canceled', // Order has been canceled. May have been before or after submission, due to failure or not.
}

export enum MerchItemState {
  PURCHASED = 'purchased', // Item purchased; may need customization
  CUSTOMIZED = 'customized', // Customization complete
  READY_FOR_FULFILLMENT = 'ready_for_fulfillment', // Ready to be added to an order
  ADDED_TO_ORDER = 'added_to_order', // Item has been added to an order
}

export enum MerchOrderFulfillmentState {
  DRAFT = 'draft', // Order submitted to printer in draft mode
  PENDING = 'pending', // Awaiting acceptance for fulfillment
  ON_HOLD = 'on_hold', // Issue encountered; needs resolution before fulfillment
  FAILED = 'failed', // Fulfillment failed at the printer. This is not a terminal state. Action must be taken.
  CANCELED = 'canceled', // Order canceled by the printer
  IN_PROGRESS = 'in_progress', // Order is being fulfilled
  PARTIAL = 'partial', // Some items have shipped while others are pending
  FULFILLED = 'fulfilled', // Entire order has shipped
}

export interface OrderItem {
  id: number;
  internalVariant: MerchInternalVariant;
  customizationOptions?: MerchCustomizationOptions;
  state: MerchItemState;
}

export interface Order {
  id: number;
  createdAt: string;
  state: MerchOrderState;
  fulfillmentState?: MerchOrderFulfillmentState;
  items: OrderItem[];
  trackingUrl?: string;
}
