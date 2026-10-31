import FulfillmentProvider from './FulfillmentProvider';

export const PRODIGI_FULFILLMENT_IMPLEMENTED = false;

const notImplemented = (): Promise<never> =>
  Promise.reject(new Error('Prodigi is not implemented'));

const ProdigiFulfillmentProvider: FulfillmentProvider = {
  sendsCustomizationEmail: false,
  createOrder: notImplemented,
  addItemToOrder: notImplemented,
  submitOrderForFulfillment: notImplemented,
};

export default ProdigiFulfillmentProvider;
