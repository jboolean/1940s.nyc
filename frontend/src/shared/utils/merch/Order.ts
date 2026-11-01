// All these copied from the backend

export enum MerchInternalVariant {
  TOTE_BAG_SMALL = 'tote-bag-small',
  PRINT_HPR_4X6 = 'print-hpr-4x6',
  PRINT_HPR_8X12 = 'print-hpr-8x12',
  PRINT_FAP_8X12_FRAMED = 'print-fap-8x12-framed',
}

export interface ToteBagCustomizationOptions {
  variant: MerchInternalVariant.TOTE_BAG_SMALL;
  lat: number;
  lng: number;
  style: 'outline' | 'solid';
  foregroundColor: 'red' | 'green' | 'creme' | 'dark';
  backgroundColor: 'red' | 'green' | 'creme' | 'dark';
}

export interface PrintCustomizationOptions {
  variant: Exclude<MerchInternalVariant, MerchInternalVariant.TOTE_BAG_SMALL>;
  photoIdentifier: string;
  colorize: boolean;
}

export type MerchCustomizationOptions =
  | ToteBagCustomizationOptions
  | PrintCustomizationOptions;

export function isPrintOptions(
  options: MerchCustomizationOptions
): options is PrintCustomizationOptions {
  return options.variant !== MerchInternalVariant.TOTE_BAG_SMALL;
}

export function isToteOptions(
  options: MerchCustomizationOptions
): options is ToteBagCustomizationOptions {
  return options.variant === MerchInternalVariant.TOTE_BAG_SMALL;
}

export function getToteOptions(
  item: OrderItem
): ToteBagCustomizationOptions | undefined {
  const options = item.customizationOptions;
  return options && isToteOptions(options) ? options : undefined;
}

export enum MerchOrderState {
  BUILDING = 'building', // Order is in draft, items are being added
  PENDING_SUBMISSION = 'pending_submission', // Order is ready to be submitted to the printer
  SUBMITTING = 'submitting', // Claimed by a submitter, waiting on the printer to accept the order
  SUBMITTED_FOR_FULFILLMENT = 'submitted_for_fulfillment', // Order has been submitted to the printer, see fulfillment state
  CANCELED = 'canceled', // Order has been canceled. May have been before or after submission, due to failure or not.
}

export enum MerchItemState {
  PURCHASED = 'purchased', // Item purchased; may need customization
  CUSTOMIZED = 'customized', // Customization complete
  READY_FOR_FULFILLMENT = 'ready_for_fulfillment', // Ready to be added to an order
  PRINTFILE_FAILED = 'printfile_failed', // Print file could not be created
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
  // The customer-facing name, sent by the API so the catalog lives in one place.
  label: string;
  customizationOptions?: MerchCustomizationOptions;
  state: MerchItemState;
}

export interface Order {
  id: number;
  createdAt: string;
  userId: number;
  email?: string;
  state: MerchOrderState;
  fulfillmentState?: MerchOrderFulfillmentState;
  items: OrderItem[];
  trackingUrl?: string;
}
