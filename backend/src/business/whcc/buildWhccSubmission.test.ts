import type MerchOrder from '../../entities/MerchOrder';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import {
  buildWhccConfiguredProduct,
  buildWhccConfiguredProducts,
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

it('builds each item from the print file at the key the renderer wrote', () => {
  const withItems = {
    ...order,
    items: [
      {
        id: 3,
        internalVariant: MerchInternalVariant.PRINT_4X6,
        printfileToken: 'abc',
      },
      {
        id: 4,
        internalVariant: MerchInternalVariant.PRINT_4X6,
        printfileToken: null,
      },
    ],
  } as MerchOrder;
  expect(
    buildWhccConfiguredProducts(withItems).map((p) => p.images?.[0].url)
  ).toEqual([
    'https://photos.1940s.nyc/merch/printfiles-dev/3-abc.jpg',
    'https://photos.1940s.nyc/merch/printfiles-dev/4.jpg',
  ]);
});

it('builds the tabletop framed print as a 5x7 framed print with an easel back', () => {
  expect(
    buildWhccConfiguredProduct(
      MerchInternalVariant.FRAMED_PRINT_5X7_EASEL,
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
