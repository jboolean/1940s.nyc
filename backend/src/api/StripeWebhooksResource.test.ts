import type { Request, Response } from 'express';
import * as LedgerService from '../business/ledger/LedgerService';
import * as MerchOrderService from '../business/merch/MerchOrderService';
import MerchInternalVariant from '../enum/MerchInternalVariant';
import stripe from '../third-party/stripe';
import router from './StripeWebhooksResource';

jest.mock('express-ipfilter', () => ({
  __esModule: true,
  default: {
    IpFilter: () => (_q: unknown, _r: unknown, next: () => void) => next(),
  },
}));
jest.mock('../business/email/EmailCampaignService', () => ({}));
jest.mock('../business/ledger/LedgerService', () => ({
  grantCredits: jest.fn(),
  grantCreditsForTip: jest.fn(),
}));
jest.mock('../business/merch/MerchOrderService', () => ({
  createMerchOrder: jest.fn().mockResolvedValue({ id: 1 }),
}));
// Loading the real Printful provider reads PRINTFUL_SK at import time, which tests do not set.
jest.mock('../business/merch/providers/PrintfulFulfillmentProvider', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('../business/users/UserService', () => ({
  attachStripeCustomerAndDetermineUserId: jest.fn().mockResolvedValue(9),
}));
jest.mock('../third-party/stripe', () => ({
  __esModule: true,
  default: { checkout: { sessions: { retrieve: jest.fn() } } },
}));

type Handler = (req: Request, res: Response) => Promise<void>;

async function deliver(session: object): Promise<number | undefined> {
  jest
    .mocked(stripe.checkout.sessions.retrieve)
    .mockResolvedValue(session as never);
  const layer = (
    router as unknown as {
      stack: Array<{ route?: { stack: Array<{ handle: Handler }> } }>;
    }
  ).stack.find((l) => l.route);
  const status = jest.fn((code: number) => ({
    statusCode: code,
    send: jest.fn(),
  }));
  await (layer?.route as { stack: Array<{ handle: Handler }> }).stack[0].handle(
    {
      body: {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_1',
            payment_status: 'paid',
            amount_subtotal: 3800,
            payment_intent: 'pi_1',
          },
        },
      },
    } as Request,
    { status } as unknown as Response
  );
  return status.mock.calls[0]?.[0];
}

function printLineItem(overrides: object = {}): object {
  return {
    id: 'li_1',
    quantity: 2,
    price: {
      product: {
        metadata: {
          'product-type': 'merch',
          'merch-internal-variant': MerchInternalVariant.PRINT_HPR_8X12,
        },
      },
    },
    metadata: { 'photo-identifier': 'p1', colorize: 'true' },
    ...overrides,
  };
}

const address = {
  name: 'A',
  address: {
    line1: '1 Main',
    city: 'NYC',
    state: 'NY',
    postal_code: '10007',
    country: 'US',
  },
};

describe('checkout.session.completed for merch', () => {
  const create = jest.mocked(MerchOrderService.createMerchOrder);
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  const session = (extra: object = {}): object => ({
    customer: 'cus_1',
    metadata: {},
    line_items: { data: [printLineItem()] },
    collected_information: { shipping_details: address },
    shipping_cost: {
      shipping_rate: { metadata: { 'prodigi-shipping-method': 'Express' } },
    },
    ...extra,
  });

  it('creates the order with the chosen shipping method and grants no credits', async () => {
    await deliver(session());
    expect(create).toHaveBeenCalledWith(
      9,
      'cs_1',
      expect.objectContaining({ line1: '1 Main', postalCode: '10007' }),
      expect.any(Array),
      'Express'
    );
    expect(LedgerService.grantCreditsForTip).not.toHaveBeenCalled();
  });

  it('turns each print copy into a customized item carrying its photo', async () => {
    await deliver(session());
    const options = {
      variant: MerchInternalVariant.PRINT_HPR_8X12,
      photoIdentifier: 'p1',
      colorize: true,
    };
    expect(create.mock.calls[0][3]).toEqual([
      {
        variant: 'print-hpr-8x12',
        customizationOptions: options,
        state: 'customized',
      },
      {
        variant: 'print-hpr-8x12',
        customizationOptions: options,
        state: 'customized',
      },
    ]);
  });

  it('creates a tote order with no shipping method and grants its tip credits', async () => {
    const tote = {
      id: 'li_2',
      quantity: 2,
      price: {
        product: {
          metadata: {
            'product-type': 'merch',
            'merch-internal-variant': 'tote-bag-small',
          },
        },
      },
    };
    // The tote's fixed shipping rate, which names no shipping method.
    await deliver(
      session({
        line_items: { data: [tote] },
        shipping_cost: { shipping_rate: { metadata: {} } },
      })
    );

    expect(create).toHaveBeenCalledWith(
      9,
      'cs_1',
      expect.anything(),
      [{ variant: 'tote-bag-small' }, { variant: 'tote-bag-small' }],
      undefined
    );
    expect(LedgerService.grantCreditsForTip).toHaveBeenCalledWith(
      9,
      3800,
      'pi_1'
    );
  });

  it('creates no order at all for a basket that mixes tote bags and prints', async () => {
    const tote = {
      id: 'li_2',
      quantity: 1,
      price: {
        product: {
          metadata: {
            'product-type': 'merch',
            'merch-internal-variant': 'tote-bag-small',
          },
        },
      },
    };
    const status = await deliver(
      session({ line_items: { data: [printLineItem(), tote] } })
    );

    expect(status).toBe(500);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('mixes printers'),
      expect.anything()
    );
    expect(create).not.toHaveBeenCalled();
  });

  it.each([
    [
      'tagged with a type the webhook does not handle',
      { 'product-type': 'print' },
    ],
    ['not tagged merch', {}],
  ])('refuses, creating nothing, a print product %s', async (_name, tag) => {
    const mistagged = printLineItem({
      price: {
        product: {
          metadata: {
            ...tag,
            'merch-internal-variant': MerchInternalVariant.PRINT_HPR_8X12,
          },
        },
      },
    });
    const status = await deliver(
      session({ line_items: { data: [mistagged] } })
    );

    expect(status).toBe(500);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[merch-alert]'),
      expect.anything()
    );
    expect(create).not.toHaveBeenCalled();
    expect(LedgerService.grantCreditsForTip).not.toHaveBeenCalled();
  });

  it('still treats an untagged product that is not merch as it always has', async () => {
    const plain = {
      id: 'li_3',
      quantity: 1,
      price: { product: { metadata: {} } },
    };
    const status = await deliver(session({ line_items: { data: [plain] } }));

    expect(status).toBe(200);
    expect(create).not.toHaveBeenCalled();
    expect(LedgerService.grantCreditsForTip).toHaveBeenCalledWith(
      9,
      3800,
      'pi_1'
    );
  });
});
