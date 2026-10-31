import type { CreateOrderRequest, ShippingMethod } from 'prodigi-print-api';
import MerchOrder from '../../entities/MerchOrder';
import { getPrintJpegDirectUrl } from '../utils/printfileUtils';
import required from '../utils/required';
import { createCallbackUrl } from './prodigiCallbackAuth';
import { getPrintProduct } from './printCatalog';

const SHIPPING_METHODS: ShippingMethod[] = [
  'Budget',
  'Standard',
  'StandardPlus',
  'Express',
  'Overnight',
];

export function buildProdigiOrder(
  order: MerchOrder,
  recipientEmail?: string
): CreateOrderRequest {
  const shippingMethod = SHIPPING_METHODS.find(
    (m) => m === order.providerShippingMethod
  );
  if (!shippingMethod) {
    throw new Error(
      `Order ${order.id} has no valid shipping method: ${String(order.providerShippingMethod)}`
    );
  }
  const address = required(order.shippingAddress, 'order.shippingAddress');

  return {
    merchantReference: `merch-order-${order.id}`,
    // Makes re-submitting after a failure return the existing Prodigi order instead of a duplicate.
    idempotencyKey: `merch-order-${order.id}`,
    shippingMethod,
    callbackUrl: createCallbackUrl(order.id),
    recipient: {
      name: required(address.name, 'shippingAddress.name'),
      email: recipientEmail,
      address: {
        line1: required(address.line1, 'shippingAddress.line1'),
        line2: address.line2,
        townOrCity: required(address.city, 'shippingAddress.city'),
        stateOrCounty: address.stateCode,
        postalOrZipCode: required(
          address.postalCode,
          'shippingAddress.postalCode'
        ),
        countryCode: required(
          address.countryCode,
          'shippingAddress.countryCode'
        ),
      },
    },
    items: order.items.map((item) => {
      const product = getPrintProduct(item.internalVariant);
      return {
        merchantReference: `item-${item.id}`,
        sku: product.sku,
        copies: 1,
        sizing: product.sizing,
        attributes: product.attributes,
        assets: [{ printArea: 'default', url: getPrintJpegDirectUrl(item.id) }],
      };
    }),
  };
}
