import MerchCustomizationOptions from '../../entities/MerchCustomizationOptions';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import MerchItemState from '../../enum/MerchItemState';
import MerchOrderFulfillmentState from '../../enum/MerchOrderFulfillmentState';
import MerchOrderState from '../../enum/MerchOrderState';

export interface MerchOrderItemApiModel {
  id: number;
  internalVariant: MerchInternalVariant;
  customizationOptions?: MerchCustomizationOptions;
  state: MerchItemState;
  printfileUrl?: string;
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
