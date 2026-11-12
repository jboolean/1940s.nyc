import MerchOrder from '../../entities/MerchOrder';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import MerchProvider from '../../enum/MerchProvider';
import { getPrintProduct } from '../merch/printCatalog';
import { getPrintfileDirectUrl } from '../utils/printfileUtils';
import required from '../utils/required';
import type {
  ConfiguredProductRequest,
  ShippingAddress,
  SubmissionRequest,
} from './whccApi';

// Used as the idempotency key and to find a submission after a lost response. The stage keeps
// environments on one WHCC account apart. Max 32 ASCII characters.
export function getWhccReference(orderId: number): string {
  const stage = (process.env.STAGE ?? 'dev').slice(0, 10);
  return `${stage}-merch-order-${orderId}`;
}

// One product for a print variant and image. Quantity is set on the submission.
export function buildWhccConfiguredProduct(
  variant: MerchInternalVariant,
  imageUrl: string
): ConfiguredProductRequest {
  const { productRef, selections } = required(
    getPrintProduct(variant),
    `print product for ${variant}`
  )[MerchProvider.WHCC];
  return {
    productId: productRef,
    selections: { ...selections, quantity: 1 },
    images: [{ url: imageUrl }],
  };
}

export function buildWhccConfiguredProducts(
  order: MerchOrder
): ConfiguredProductRequest[] {
  return order.items.map((item) =>
    buildWhccConfiguredProduct(
      item.internalVariant,
      getPrintfileDirectUrl(item.id, 'jpg')
    )
  );
}

function buildAddress(order: MerchOrder): ShippingAddress {
  const address = required(order.shippingAddress, 'order.shippingAddress');
  return {
    name: required(address.name, 'shippingAddress.name'),
    addr1: required(address.line1, 'shippingAddress.line1'),
    addr2: address.line2,
    city: required(address.city, 'shippingAddress.city'),
    state: required(address.stateCode, 'shippingAddress.stateCode'),
    zip: required(address.postalCode, 'shippingAddress.postalCode'),
    country: required(address.countryCode, 'shippingAddress.countryCode'),
  };
}

// configuredProductIds match order.items by position.
export function buildWhccSubmission(
  order: MerchOrder,
  configuredProductIds: string[]
): SubmissionRequest {
  return {
    items: configuredProductIds.map((configuredProductId) => ({
      configuredProductId,
      quantity: 1,
    })),
    shipping: {
      type: 'dropship',
      priority: required(
        order.providerShippingMethod,
        'order.providerShippingMethod'
      ),
      address: buildAddress(order),
    },
    reference: getWhccReference(order.id),
  };
}
