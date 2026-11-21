import type MerchOrder from '../../entities/MerchOrder';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import {
  buildWhccConfiguredProduct,
  buildWhccSubmission,
} from './buildWhccSubmission';

const order = {
  id: 12,
  providerShippingMethod: 'dropship_expedited',
  shippingAddress: {
    name: 'Ada',
    line1: '1 Main St',
    city: 'New York',
    stateCode: 'NY',
    postalCode: '10001',
    countryCode: 'US',
  },
} as MerchOrder;

it('builds a dropship submission from the order address and shipping method', () => {
  expect(buildWhccSubmission(order, ['CF_1', 'CF_2'])).toEqual({
    items: [
      { configuredProductId: 'CF_1', quantity: 1 },
      { configuredProductId: 'CF_2', quantity: 1 },
    ],
    shipping: {
      type: 'dropship',
      priority: 'dropship_expedited',
      address: {
        name: 'Ada',
        addr1: '1 Main St',
        addr2: undefined,
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      },
    },
    reference: 'dev-merch-order-12',
  });
});

it('builds the tabletop framed print as a 5x7 framed print with an easel back', () => {
  expect(
    buildWhccConfiguredProduct(
      MerchInternalVariant.PRINT_FAP_5X7_EASEL,
      'https://printfile'
    )
  ).toMatchObject({
    productId: 'framed-print',
    selections: {
      size: '5x7',
      moulding: 'gallery_fine_black',
      backing: 'easel_back',
      quantity: 1,
    },
    images: [{ url: 'https://printfile' }],
  });
});
