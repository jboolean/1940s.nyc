import MerchOrder from '../../../entities/MerchOrder';
import MerchOrderItem from '../../../entities/MerchOrderItem';
import ShippingAddress from '../../../entities/ShippingAddress';
import MerchOrderFulfillmentState from '../../../enum/MerchOrderFulfillmentState';

export interface CreatedProviderOrder {
  // Undefined when the provider has no order to reference until submission.
  providerOrderId?: string;
  fulfillmentState?: MerchOrderFulfillmentState;
}

interface FulfillmentProvider {
  // True when the customer finishes the item themselves from an emailed link (tote bags).
  // Otherwise the order is customized at purchase and gets a plain confirmation email.
  readonly sendsCustomizationEmail: boolean;

  createOrder(
    merchOrderId: number,
    shippingAddress: ShippingAddress
  ): Promise<CreatedProviderOrder>;

  addItemToOrder(item: MerchOrderItem): Promise<void>;

  submitOrderForFulfillment(order: MerchOrder): Promise<void>;
}

export default FulfillmentProvider;
