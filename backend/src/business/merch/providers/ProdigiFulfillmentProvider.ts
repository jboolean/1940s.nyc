import MerchOrder from '../../../entities/MerchOrder';
import { buildProdigiOrder } from '../../prodigi/buildProdigiOrder';
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

  async cancelSubmittedOrder(order: MerchOrder): Promise<void> {
    await ProdigiService.cancelOrder(
      required(order.providerOrderId, 'providerOrderId')
    );
  },
};

export default ProdigiFulfillmentProvider;
