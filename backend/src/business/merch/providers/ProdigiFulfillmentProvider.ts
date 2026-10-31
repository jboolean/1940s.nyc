import FulfillmentProvider from './FulfillmentProvider';

const notImplemented = (): Promise<never> =>
  Promise.reject(new Error('Prodigi is not implemented'));

const ProdigiFulfillmentProvider: FulfillmentProvider = {
  createOrder: notImplemented,
  addItemToOrder: notImplemented,
  submitOrderForFulfillment: notImplemented,
};

export default ProdigiFulfillmentProvider;
