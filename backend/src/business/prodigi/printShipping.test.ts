import type { Quote } from 'prodigi-print-api';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import * as ProdigiService from './ProdigiService';
import { buildShippingOptions, quotePrintShipping } from './printShipping';

jest.mock('./ProdigiService', () => ({ getQuotes: jest.fn() }));

function quote(
  method: string,
  shipping: string,
  service: string,
  currency = 'USD'
): Quote {
  return {
    shipmentMethod: method,
    costSummary: { shipping: { amount: shipping, currency } },
    shipments: [{ carrier: { name: 'UPS', service } }],
  } as unknown as Quote;
}

describe('buildShippingOptions', () => {
  it('drops Budget when it is no cheaper than Standard', () => {
    const options = buildShippingOptions([
      quote('Budget', '24.80', 'UPS Ground'),
      quote('Standard', '24.80', 'UPS Ground'),
      quote('Express', '35.60', 'UPS 3 Day Select'),
    ]);
    expect(
      options.map(
        (o) => o.shipping_rate_data?.metadata?.['prodigi-shipping-method']
      )
    ).toEqual(['Standard', 'Express']);
  });
});

describe('quotePrintShipping', () => {
  it('refuses a print Prodigi has no product for, naming the variant', async () => {
    await expect(
      quotePrintShipping([
        { variant: MerchInternalVariant.PRINT_FAP_5X7_EASEL, quantity: 1 },
      ])
    ).rejects.toThrow('Prodigi product for print-fap-5x7-easel');
    expect(ProdigiService.getQuotes).not.toHaveBeenCalled();
  });
});
