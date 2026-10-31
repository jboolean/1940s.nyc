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
jest.mock('../merch/providers/ProdigiFulfillmentProvider', () => ({
  PRODIGI_FULFILLMENT_IMPLEMENTED: true,
}));
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
      default_price: { unit_amount: 1900, currency: 'usd' },
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

  it('rejects photos outside the 1940s collection', async () => {
    findOne.mockResolvedValue({
      identifier: 'p1',
      collection: Collection.EIGHTIES,
    });
    await expect(createPrintCheckoutSession(base)).rejects.toMatchObject({
      status: 400,
    });
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('rejects unknown photos, inactive variants and bad quantities', async () => {
    findOne.mockResolvedValue(null);
    await expect(createPrintCheckoutSession(base)).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      createPrintCheckoutSession({
        ...base,
        variant: MerchInternalVariant.PRINT_PHO_8X12,
      })
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      createPrintCheckoutSession({
        ...base,
        variant: MerchInternalVariant.TOTE_BAG_SMALL,
      })
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      createPrintCheckoutSession({ ...base, quantity: 0 })
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      createPrintCheckoutSession({ ...base, quantity: 11 })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('builds a session with the photo thumbnail, customization metadata and quoted shipping', async () => {
    await createPrintCheckoutSession(base);
    const params = jest.mocked(stripe.checkout.sessions.create).mock
      .calls[0][0] as import('stripe').Stripe.Checkout.SessionCreateParams;
    const lineItem = params.line_items?.[0];
    expect(lineItem?.quantity).toBe(2);
    expect(lineItem?.price_data?.unit_amount).toBe(1900);
    expect(lineItem?.price_data?.product_data?.images?.[0]).toMatch(
      /420-jpg\/p1\.jpg$/
    );
    expect(lineItem?.price_data?.product_data?.metadata).toEqual({
      'product-type': 'print',
      'merch-internal-variant': 'print-hpr-8x12',
      'photo-identifier': 'p1',
      colorize: 'true',
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
