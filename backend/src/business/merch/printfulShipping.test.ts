import { buildPrintfulShippingOptions } from './printfulShipping';

jest.mock('../utils/printfulApi', () => ({}));

const rate = (
  overrides = {}
): Parameters<typeof buildPrintfulShippingOptions>[0][number] => ({
  shipping: 'STANDARD',
  shipping_method_name: 'Flat Rate (3-4 business days)',
  rate: '4.99',
  currency: 'USD',
  min_delivery_days: 3,
  max_delivery_days: 4,
  shipments: [],
  ...overrides,
});

describe('buildPrintfulShippingOptions', () => {
  it('charges exactly the quoted rate and records the method', () => {
    const [option] = buildPrintfulShippingOptions([rate()]);
    expect(option.shipping_rate_data).toMatchObject({
      display_name: 'Flat Rate (3-4 business days)',
      fixed_amount: { amount: 499, currency: 'usd' },
      delivery_estimate: {
        minimum: { unit: 'business_day', value: 3 },
        maximum: { unit: 'business_day', value: 4 },
      },
      metadata: { 'printful-shipping-method': 'STANDARD' },
    });
  });

  it('omits the estimate when Printful gives none', () => {
    const [option] = buildPrintfulShippingOptions([
      rate({ min_delivery_days: undefined, max_delivery_days: undefined }),
    ]);
    expect(option.shipping_rate_data?.delivery_estimate).toBeUndefined();
  });

  it('rejects a non-USD quote', () => {
    expect(() =>
      buildPrintfulShippingOptions([rate({ currency: 'EUR' })])
    ).toThrow('not USD');
  });
});
