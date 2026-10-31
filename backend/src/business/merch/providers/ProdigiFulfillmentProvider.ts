import { AppDataSource } from '../../../createConnection';
import MerchOrder from '../../../entities/MerchOrder';
import { buildProdigiOrder } from '../../prodigi/buildProdigiOrder';
import * as ProdigiService from '../../prodigi/ProdigiService';
import * as UserService from '../../users/UserService';
import required from '../../utils/required';
import FulfillmentProvider from './FulfillmentProvider';

// Prodigi has no draft orders: creating the order is what submits it. Nothing is sent to Prodigi
// until every print file is ready and the order is submitted.
const ProdigiFulfillmentProvider: FulfillmentProvider = {
  sendsCustomizationEmail: false,

  createOrder() {
    return Promise.resolve({});
  },

  addItemToOrder() {
    return Promise.resolve();
  },

  async submitOrderForFulfillment(order: MerchOrder): Promise<void> {
    if (order.providerOrderId) {
      return;
    }
    const user = await UserService.getUser(order.userId);
    const prodigiOrder = await ProdigiService.createOrder(
      buildProdigiOrder(order, user.email ?? undefined)
    );
    order.providerOrderId = prodigiOrder.id;
    // Persist right away so callbacks, which can arrive immediately, find the order.
    await AppDataSource.getRepository(MerchOrder).update(order.id, {
      providerOrderId: prodigiOrder.id,
    });
  },

  async cancelSubmittedOrder(order: MerchOrder): Promise<void> {
    await ProdigiService.cancelOrder(
      required(order.providerOrderId, 'providerOrderId')
    );
  },
};

export default ProdigiFulfillmentProvider;
