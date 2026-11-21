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
    buildProdigiOrder(order(MerchInternalVariant.PRINT_FAP_8X12_FRAMED)).items
  ).toMatchObject([
    {
      merchantReference: 'item-3',
      sku: 'GLOBAL-BOX-8X12',
      attributes: { color: 'black' },
    },
  ]);
});

it('refuses a print Prodigi has no product for, naming the variant', () => {
  expect(() =>
    buildProdigiOrder(order(MerchInternalVariant.PRINT_FAP_5X7_EASEL))
  ).toThrow('Prodigi product for print-fap-5x7-easel');
});
