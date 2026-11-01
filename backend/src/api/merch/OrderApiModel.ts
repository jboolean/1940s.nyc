import MerchCustomizationOptions from '../../entities/MerchCustomizationOptions';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import MerchItemState from '../../enum/MerchItemState';
import MerchOrderFulfillmentState from '../../enum/MerchOrderFulfillmentState';
import MerchOrderState from '../../enum/MerchOrderState';

export interface MerchOrderItemApiModel {
  id: number;
  internalVariant: MerchInternalVariant;
  // The customer-facing name, so the frontend does not keep its own copy of the catalog.
  label: string;
  customizationOptions?: MerchCustomizationOptions;
  state: MerchItemState;
}

export interface MerchOrderApiModel {
  id: number;
  createdAt: string;
  userId: number;
  email?: string;
  state: MerchOrderState;
  fulfillmentState?: MerchOrderFulfillmentState;
  items: MerchOrderItemApiModel[];
  trackingUrl?: string;
}
