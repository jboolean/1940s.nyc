import Collection from '../../enum/Collection';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import stripe from '../../third-party/stripe';
import { createPrintCheckoutSession } from './PrintCheckoutService';
import * as ProdigiService from './ProdigiService';

const findOne = jest.fn();
jest.mock('../../createConnection', () => ({
  AppDataSource: { getRepository: () => ({ findOne }) },
}));
jest.mock('./ProdigiService', () => ({ getQuotes: jest.fn() }));
jest.mock('../../third-party/stripe', () => ({
  __esModule: true,
  default: {
    products: { retrieve: jest.fn() },
    checkout: { sessions: { create: jest.fn() } },
  },
}));

const base = {
  successUrl: 'http://s',
  cancelUrl: 'http://c',
  photoIdentifier: 'p1',
  variant: MerchInternalVariant.PRINT_HPR_8X12,
  quantity: 2,
  colorize: true,
};

describe('createPrintCheckoutSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findOne.mockResolvedValue({
      identifier: 'p1',
      collection: Collection.FOURTIES,
      borough: 'Manhattan',
      effectiveAddress: { address: '1 Main St' },
    });
    jest.mocked(stripe.products.retrieve).mockResolvedValue({
      default_price: { id: 'price_1', unit_amount: 1900, currency: 'usd' },
    } as never);
    jest.mocked(ProdigiService.getQuotes).mockResolvedValue([
      {
        shipmentMethod: 'Standard',
        costSummary: { shipping: { amount: '11.85', currency: 'USD' } },
        shipments: [{ carrier: { service: 'UPS Ground' } }],
      },
    ] as never);
    jest
      .mocked(stripe.checkout.sessions.create)
      .mockResolvedValue({ id: 'cs_1', url: 'http://pay' } as never);
  });

  it('rejects photos outside the 1940s collection (prints are 1940s only)', async () => {
    findOne.mockResolvedValue({
      identifier: 'p1',
      collection: Collection.EIGHTIES,
    });
    await expect(createPrintCheckoutSession(base)).rejects.toMatchObject({
      status: 400,
    });
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('references the product default price and carries the card details on the line item', async () => {
    await createPrintCheckoutSession(base);
    const params = jest.mocked(stripe.checkout.sessions.create).mock
      .calls[0][0] as import('stripe').Stripe.Checkout.SessionCreateParams;
    const lineItem = params.line_items?.[0];
    expect(lineItem?.quantity).toBe(2);
    expect(lineItem?.price).toBe('price_1');
    expect(lineItem?.price_data).toBeUndefined();
    expect(lineItem?.metadata).toEqual({
      'photo-identifier': 'p1',
      colorize: 'true',
      description: '1 Main St, Manhattan (1940s tax photo)',
    });
    expect(stripe.products.retrieve).toHaveBeenCalledWith('print-hpr-8x12', {
      expand: ['default_price'],
    });
    expect(
      params.shipping_options?.[0].shipping_rate_data?.fixed_amount?.amount
    ).toBe(1185);
    expect(params.shipping_address_collection?.allowed_countries).toEqual([
      'US',
    ]);
    expect(ProdigiService.getQuotes).toHaveBeenCalledWith(
      expect.objectContaining({
        destinationCountryCode: 'US',
        items: [expect.objectContaining({ sku: 'GLOBAL-HPR-8X12', copies: 2 })],
      })
    );
  });
});
