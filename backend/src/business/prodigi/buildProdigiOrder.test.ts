import type MerchOrder from '../../entities/MerchOrder';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import { buildProdigiOrder } from './buildProdigiOrder';

const order = (internalVariant: MerchInternalVariant): MerchOrder =>
  ({
    id: 12,
    providerShippingMethod: 'Standard',
    shippingAddress: {
      name: 'Ada',
      line1: '1 Main St',
      city: 'New York',
      stateCode: 'NY',
      postalCode: '10001',
      countryCode: 'US',
    },
    items: [{ id: 3, internalVariant }],
  }) as MerchOrder;

it('sends the Prodigi product for each print', () => {
  expect(
    buildProdigiOrder(order(MerchInternalVariant.FRAMED_PRINT_8X12_WALL)).items
  ).toMatchObject([
    {
      merchantReference: 'item-3',
      sku: 'GLOBAL-BOX-8X12',
      attributes: { color: 'black' },
    },
  ]);
});

it('sends the print file at the key the renderer wrote', () => {
  const withToken = {
    ...order(MerchInternalVariant.PRINT_8X12),
    items: [
      {
        id: 3,
        internalVariant: MerchInternalVariant.PRINT_8X12,
        printfileToken: 'abc',
      },
    ],
  } as MerchOrder;
  expect(buildProdigiOrder(withToken).items[0].assets).toEqual([
    {
      printArea: 'default',
      url: 'https://photos.1940s.nyc/merch/printfiles-dev/3-abc.jpg',
    },
  ]);
});

it('sends an item rendered before tokens at its old key', () => {
  expect(
    buildProdigiOrder(order(MerchInternalVariant.PRINT_8X12)).items[0].assets
  ).toEqual([
    {
      printArea: 'default',
      url: 'https://photos.1940s.nyc/merch/printfiles-dev/3.jpg',
    },
  ]);
});

it('refuses a print Prodigi has no product for, naming the variant', () => {
  expect(() =>
    buildProdigiOrder(order(MerchInternalVariant.FRAMED_PRINT_5X7_EASEL))
  ).toThrow('Prodigi product for framed-print-5x7-easel');
});
