import MerchOrder from '../../../entities/MerchOrder';
import { handleOrderCallback } from '../../prodigi/ProdigiCallbackService';
import { buildProdigiOrder } from '../../prodigi/buildProdigiOrder';
import {
  PRODIGI_SHIPPING_METHOD_METADATA_KEY,
  quotePrintShipping,
} from '../../prodigi/printShipping';
import * as ProdigiService from '../../prodigi/ProdigiService';
import * as UserService from '../../users/UserService';
import required from '../../utils/required';
import FulfillmentProvider, {
  CreatedProviderOrder,
} from './FulfillmentProvider';

// Prodigi has no draft orders, so nothing is created there until the order is submitted.
const ProdigiFulfillmentProvider: FulfillmentProvider = {
  // Every order waits for a person to look it over, Prodigi's included.
  requiresReview: true,

  quoteShippingOptions: quotePrintShipping,
  shippingMethodMetadataKey: PRODIGI_SHIPPING_METHOD_METADATA_KEY,
  defaultShippingMethod: 'Standard',

  createOrder() {
    return Promise.resolve({});
  },

  addItemToOrder() {
    return Promise.resolve();
  },

  async submitOrderForFulfillment(
    order: MerchOrder
  ): Promise<CreatedProviderOrder> {
    if (order.providerOrderId) {
      return {};
    }
    const user = await UserService.getUser(order.userId);
    const prodigiOrder = await ProdigiService.createOrder(
      buildProdigiOrder(order, user.email ?? undefined)
    );
    return { providerOrderId: prodigiOrder.id };
  },

  async syncSubmittedOrder(providerOrderId: string): Promise<void> {
    await handleOrderCallback(providerOrderId, true);
  },

  async cancelSubmittedOrder(order: MerchOrder): Promise<void> {
    await ProdigiService.cancelOrder(
      required(order.providerOrderId, 'providerOrderId')
    );
  },
};

export default ProdigiFulfillmentProvider;
