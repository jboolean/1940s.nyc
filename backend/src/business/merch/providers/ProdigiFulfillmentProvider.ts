import MerchOrder from '../../../entities/MerchOrder';
import { buildProdigiOrder } from '../../prodigi/buildProdigiOrder';
import * as ProdigiService from '../../prodigi/ProdigiService';
import * as UserService from '../../users/UserService';
import required from '../../utils/required';
import FulfillmentProvider, {
  CreatedProviderOrder,
} from './FulfillmentProvider';

// Prodigi has no draft orders: creating the order is what submits it. Nothing is sent to Prodigi
// until every print file is ready and the order is submitted.
const ProdigiFulfillmentProvider: FulfillmentProvider = {
  // Prodigi fulfills as soon as the order reaches it, so waiting for a person would delay it.
  requiresReview: false,

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
