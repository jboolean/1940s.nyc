import type Stripe from 'stripe';
import Collection from '../../enum/Collection';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import stripe from '../../third-party/stripe';
import * as ProdigiService from '../prodigi/ProdigiService';
import { createMerchCheckoutSession } from './MerchCheckoutService';

const findOne = jest.fn();
jest.mock('../../createConnection', () => ({
  AppDataSource: { getRepository: () => ({ findOne }) },
}));
jest.mock('../prodigi/ProdigiService', () => ({ getQuotes: jest.fn() }));
jest.mock('../../third-party/stripe', () => ({
  __esModule: true,
  default: {
    products: { retrieve: jest.fn() },
    checkout: { sessions: { create: jest.fn() } },
  },
}));

const urls = { successUrl: 'http://s', cancelUrl: 'http://c' };
const print = {
  variant: MerchInternalVariant.PRINT_HPR_8X12,
  quantity: 2,
  print: { photoIdentifier: 'p1', colorize: true },
};

function sessionParams(): Stripe.Checkout.SessionCreateParams {
  return jest.mocked(stripe.checkout.sessions.create).mock
    .calls[0][0] as Stripe.Checkout.SessionCreateParams;
}

describe('createMerchCheckoutSession', () => {
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

  it('builds the tote session it always has: catalog price, fixed shipping rate, no Prodigi', async () => {
    await createMerchCheckoutSession({
      ...urls,
      user: { id: 3, email: 'a@b.c' } as never,
      items: [{ variant: MerchInternalVariant.TOTE_BAG_SMALL, quantity: 2 }],
    });

    expect(stripe.products.retrieve).toHaveBeenCalledWith(
      'prod_RjkZ81n7LrxUnl',
      { expand: ['default_price'] }
    );
    expect(sessionParams()).toEqual({
      success_url: 'http://s',
      cancel_url: 'http://c',
      customer: undefined,
      customer_creation: 'always',
      customer_email: 'a@b.c',
      shipping_address_collection: { allowed_countries: ['US'] },
      metadata: { userId: 3 },
      mode: 'payment',
      line_items: [{ price: 'price_1', quantity: 2 }],
      payment_intent_data: {},
      shipping_options: [{ shipping_rate: 'shr_1QssVnFCLBtNZLVlK1TZpXet' }],
    });
    expect(ProdigiService.getQuotes).not.toHaveBeenCalled();
    expect(findOne).not.toHaveBeenCalled();
  });

  it('references the print default price, carries the customization choices and quotes Prodigi shipping', async () => {
    await createMerchCheckoutSession({ ...urls, items: [print] });

    const params = sessionParams();
    expect(params.line_items).toEqual([
      {
        price: 'price_1',
        quantity: 2,
        metadata: {
          'photo-identifier': 'p1',
          colorize: 'true',
          description: '1 Main St, Manhattan (1940s tax photo)',
        },
      },
    ]);
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

  it('rejects photos outside the 1940s collection (prints are 1940s only)', async () => {
    findOne.mockResolvedValue({
      identifier: 'p1',
      collection: Collection.EIGHTIES,
    });
    await expect(
      createMerchCheckoutSession({ ...urls, items: [print] })
    ).rejects.toMatchObject({ status: 400 });
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('rejects a print with no photo, as the tote checkout sends it, with a 400', async () => {
    await expect(
      createMerchCheckoutSession({
        ...urls,
        items: [{ variant: MerchInternalVariant.PRINT_HPR_8X12, quantity: 1 }],
      })
    ).rejects.toMatchObject({ status: 400 });
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('rejects a basket that would need two printers', async () => {
    await expect(
      createMerchCheckoutSession({
        ...urls,
        items: [
          print,
          { variant: MerchInternalVariant.TOTE_BAG_SMALL, quantity: 1 },
        ],
      })
    ).rejects.toMatchObject({ status: 400 });
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('refuses a live print until its live product id has been filled in', async () => {
    jest.resetModules();
    jest.doMock('../utils/isProduction', () => ({
      __esModule: true,
      default: () => true,
    }));
    const live = jest.requireActual<typeof import('./MerchCheckoutService')>(
      './MerchCheckoutService'
    );
    await expect(
      live.createMerchCheckoutSession({ ...urls, items: [print] })
    ).rejects.toMatchObject({ status: 400 });
    jest.dontMock('../utils/isProduction');
  });
});
