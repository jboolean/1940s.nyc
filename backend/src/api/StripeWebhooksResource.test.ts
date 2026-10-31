import type { Request, Response } from 'express';
import * as LedgerService from '../business/ledger/LedgerService';
import * as MerchOrderService from '../business/merch/MerchOrderService';
import MerchInternalVariant from '../enum/MerchInternalVariant';
import MerchItemState from '../enum/MerchItemState';
import stripe from '../third-party/stripe';
import router, { printLineItemToOrderItems } from './StripeWebhooksResource';

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
jest.mock('../business/users/UserService', () => ({
  attachStripeCustomerAndDetermineUserId: jest.fn().mockResolvedValue(9),
}));
jest.mock('../third-party/stripe', () => ({
  __esModule: true,
  default: { checkout: { sessions: { retrieve: jest.fn() } } },
}));

type Handler = (req: Request, res: Response) => Promise<void>;

async function deliver(session: object): Promise<void> {
  jest
    .mocked(stripe.checkout.sessions.retrieve)
    .mockResolvedValue(session as never);
  const layer = (
    router as unknown as {
      stack: Array<{ route?: { stack: Array<{ handle: Handler }> } }>;
    }
  ).stack.find((l) => l.route);
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
    { status: () => ({ send: jest.fn() }) } as unknown as Response
  );
}

function printLineItem(overrides: object = {}): object {
  return {
    id: 'li_1',
    quantity: 2,
    price: {
      product: {
        metadata: {
          'product-type': 'print',
          'merch-internal-variant': MerchInternalVariant.PRINT_HPR_8X12,
          'photo-identifier': 'p1',
          colorize: 'true',
        },
      },
    },
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

describe('printLineItemToOrderItems', () => {
  it('creates one customized item per copy', () => {
    const items = printLineItemToOrderItems(printLineItem() as never);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      variant: MerchInternalVariant.PRINT_HPR_8X12,
      customizationOptions: {
        variant: MerchInternalVariant.PRINT_HPR_8X12,
        photoIdentifier: 'p1',
        colorize: true,
      },
      state: MerchItemState.AWAITING_PRINTFILE,
    });
  });

  it('rejects line items without a photo or a print variant', () => {
    const bad = (metadata: object): object => ({
      id: 'li',
      price: { product: { metadata } },
    });
    expect(() =>
      printLineItemToOrderItems(
        bad({
          'merch-internal-variant': MerchInternalVariant.PRINT_HPR_8X12,
        }) as never
      )
    ).toThrow();
    expect(() =>
      printLineItemToOrderItems(
        bad({
          'merch-internal-variant': MerchInternalVariant.TOTE_BAG_SMALL,
          'photo-identifier': 'p1',
        }) as never
      )
    ).toThrow();
  });
});

describe('checkout.session.completed for prints', () => {
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

  it('defaults to Standard shipping when the rate has no Prodigi method', async () => {
    await deliver(
      session({ shipping_cost: { shipping_rate: { metadata: {} } } })
    );
    expect(create).toHaveBeenCalledWith(
      9,
      'cs_1',
      expect.anything(),
      expect.anything(),
      'Standard'
    );
  });

  it('does not fulfil a basket that mixes tote bags and prints, and says so loudly', async () => {
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
    await deliver(session({ line_items: { data: [printLineItem(), tote] } }));
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('mixes'),
      expect.anything()
    );
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(9, 'cs_1', expect.anything(), [
      { variant: 'tote-bag-small' },
    ]);
  });

  it('relies on createMerchOrder to return the existing order for a duplicate event', async () => {
    await deliver(session());
    await deliver(session());
    expect(create).toHaveBeenCalledTimes(2);
  });
});
