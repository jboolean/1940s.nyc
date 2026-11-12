import type Stripe from 'stripe';
import MerchOrder from '../../../entities/MerchOrder';
import MerchOrderItem from '../../../entities/MerchOrderItem';
import ShippingAddress from '../../../entities/ShippingAddress';
import MerchInternalVariant from '../../../enum/MerchInternalVariant';
import MerchOrderFulfillmentState from '../../../enum/MerchOrderFulfillmentState';

export interface CreatedProviderOrder {
  // Undefined when the provider has no order to reference until submission.
  providerOrderId?: string;
  fulfillmentState?: MerchOrderFulfillmentState;
}

export interface ShippingQuoteItem {
  variant: MerchInternalVariant;
  quantity: number;
  print?: { photoIdentifier: string };
}

interface FulfillmentProvider {
  // True when a person looks the order over before it is submitted. Everything else goes to the
  // printer as soon as the order is ready.
  readonly requiresReview: boolean;

  // Prices shipping for a basket as Checkout shipping options. Providers without it use the flat
  // default rate.
  quoteShippingOptions?(
    items: ShippingQuoteItem[]
  ): Promise<Stripe.Checkout.SessionCreateParams.ShippingOption[]>;

  // The key on a shipping rate's metadata that carries the method chosen at checkout, and the method
  // an order falls back to when the rate names none.
  readonly shippingMethodMetadataKey?: string;
  readonly defaultShippingMethod?: string;

  createOrder(
    merchOrderId: number,
    shippingAddress: ShippingAddress
  ): Promise<CreatedProviderOrder>;

  addItemToOrder(item: MerchOrderItem): Promise<void>;

  submitOrderForFulfillment(order: MerchOrder): Promise<CreatedProviderOrder>;

  // Re-reads a submitted order from the provider and applies its status. Only for providers that
  // report status changes by callback, which the order sync cron backs up.
  syncSubmittedOrder?(providerOrderId: string): Promise<void>;

  // Cancels an order that was already submitted, for providers that support it. Throws if it cannot be canceled.
  cancelSubmittedOrder?(order: MerchOrder): Promise<void>;
}

export default FulfillmentProvider;
