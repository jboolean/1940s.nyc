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

  // Providers without this use the flat default rate.
  quoteShippingOptions?(
    items: ShippingQuoteItem[]
  ): Promise<Stripe.Checkout.SessionCreateParams.ShippingOption[]>;

  readonly shippingMethodMetadataKey?: string;
  readonly defaultShippingMethod?: string;

  createOrder(
    merchOrderId: number,
    shippingAddress: ShippingAddress
  ): Promise<CreatedProviderOrder>;

  addItemToOrder(item: MerchOrderItem): Promise<void>;

  submitOrderForFulfillment(order: MerchOrder): Promise<CreatedProviderOrder>;

  // For providers that report status by callback. The sync cron covers missed callbacks.
  syncSubmittedOrder?(providerOrderId: string): Promise<void>;

  // Cancels an order that was already submitted, for providers that support it. Throws if it cannot be canceled.
  cancelSubmittedOrder?(order: MerchOrder): Promise<void>;
}

export default FulfillmentProvider;
