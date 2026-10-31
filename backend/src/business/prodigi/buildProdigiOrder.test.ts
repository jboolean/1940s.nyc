import MerchOrder from '../../entities/MerchOrder';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import { buildProdigiOrder } from './buildProdigiOrder';

jest.mock('../utils/printfileUtils', () => ({
  getPrintJpegDirectUrl: (id: number) => `https://origin/prints/${id}.jpg`,
}));

function order(overrides: Partial<MerchOrder> = {}): MerchOrder {
  return {
    id: 12,
    providerShippingMethod: 'Express',
    shippingAddress: {
      name: 'Ada Lovelace',
      line1: '1 Main St',
      line2: 'Apt 2',
      city: 'New York',
      stateCode: 'NY',
      postalCode: '10007',
      countryCode: 'US',
    },
    items: [
      { id: 101, internalVariant: MerchInternalVariant.PRINT_HPR_8X12 },
      { id: 102, internalVariant: MerchInternalVariant.PRINT_FAP_8X12_FRAMED },
    ],
    ...overrides,
  } as MerchOrder;
}

describe('buildProdigiOrder', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 's';
    delete process.env.STAGE;
  });

  it('builds an idempotent order with fitPrintArea and one asset per item', () => {
    const request = buildProdigiOrder(order(), 'a@b.c');
    expect(request).toMatchObject({
      merchantReference: 'merch-order-12',
      idempotencyKey: 'merch-order-12',
      shippingMethod: 'Express',
      recipient: {
        name: 'Ada Lovelace',
        email: 'a@b.c',
        address: {
          line1: '1 Main St',
          line2: 'Apt 2',
          townOrCity: 'New York',
          stateOrCounty: 'NY',
          postalOrZipCode: '10007',
          countryCode: 'US',
        },
      },
    });
    expect(request.items).toEqual([
      {
        merchantReference: 'item-101',
        sku: 'GLOBAL-HPR-8X12',
        copies: 1,
        sizing: 'fitPrintArea',
        attributes: {},
        assets: [
          { printArea: 'default', url: 'https://origin/prints/101.jpg' },
        ],
      },
      expect.objectContaining({
        sku: 'GLOBAL-BOX-8X12',
        attributes: { color: 'black' },
        sizing: 'fitPrintArea',
      }),
    ]);
  });

  it('only sets a callback URL where the API is publicly reachable', () => {
    expect(buildProdigiOrder(order()).callbackUrl).toBeUndefined();
    process.env.STAGE = 'production';
    expect(buildProdigiOrder(order()).callbackUrl).toMatch(
      /^https:\/\/api\.1940s\.nyc\/prodigi-webhooks\/12\/[0-9a-f]{64}$/
    );
    process.env.STAGE = 'staging';
    expect(buildProdigiOrder(order()).callbackUrl).toMatch(
      /^https:\/\/api\.staging\.1940s\.nyc\/prodigi-webhooks\/12\//
    );
  });

  it('refuses an order without a valid shipping method or address', () => {
    expect(() =>
      buildProdigiOrder(order({ providerShippingMethod: 'Teleport' }))
    ).toThrow(/shipping method/);
    expect(() =>
      buildProdigiOrder(order({ providerShippingMethod: null }))
    ).toThrow();
    expect(() => buildProdigiOrder(order({ shippingAddress: null }))).toThrow();
    expect(() =>
      buildProdigiOrder(order({ shippingAddress: { name: 'x' } }))
    ).toThrow();
  });
});
