import MerchInternalVariant from '../../enum/MerchInternalVariant';
import MerchItemState from '../../enum/MerchItemState';
import MerchProvider from '../../enum/MerchProvider';
import EmailService from '../email/EmailService';
import OrderConfirmationTemplate from '../email/templates/OrderConfirmationTemplate';
import OrderCustomizeTemplate from '../email/templates/OrderCustomizeTemplate';
import { createMerchOrder } from './MerchOrderService';
import getFulfillmentProvider, {
  selectProviderForItems,
} from './providers/getFulfillmentProvider';

const saved: unknown[] = [];
const repo = {
  save: jest.fn((e: unknown) => {
    saved.push(e);
    return Promise.resolve(Array.isArray(e) ? e : { ...(e as object), id: 7 });
  }),
  findOneByOrFail: jest.fn(() => Promise.resolve({ id: 7, userId: 1 })),
};

jest.mock('../../createConnection', () => ({
  AppDataSource: {
    transaction: (fn: (m: unknown) => unknown) =>
      fn({ getRepository: () => repo }),
  },
}));
jest.mock('./providers/getFulfillmentProvider', () => ({
  __esModule: true,
  default: jest.fn(),
  selectProviderForItems: jest.fn(),
}));
jest.mock('../users/UserService', () => ({
  getUser: jest.fn().mockResolvedValue({ id: 1, email: 'a@b.c' }),
  createMagicLinkUrl: jest.fn().mockReturnValue(new URL('http://x/orders')),
}));
jest.mock('../email/EmailService', () => ({
  __esModule: true,
  default: { sendTemplateEmail: jest.fn() },
}));
jest.mock('../email/templates/OrderShippedTemplate', () => ({}));
jest.mock('../email/templates/OrderCustomizeTemplate', () => ({
  __esModule: true,
  default: { createTemplatedEmail: jest.fn(() => 'customize-email') },
}));
jest.mock('../email/templates/OrderConfirmationTemplate', () => ({
  __esModule: true,
  default: { createTemplatedEmail: jest.fn(() => 'confirmation-email') },
}));

const selectProvider = jest.mocked(selectProviderForItems);

const print = {
  variant: MerchInternalVariant.PRINT_HPR_8X12 as const,
  photoIdentifier: 'p1',
  colorize: true,
};

describe('createMerchOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    saved.length = 0;
  });

  it('sends the plain confirmation for providers without a customization step', async () => {
    selectProvider.mockReturnValue(MerchProvider.PRODIGI);
    jest.mocked(getFulfillmentProvider).mockReturnValue({
      sendsCustomizationEmail: false,
      createOrder: () => Promise.resolve({}),
    } as never);

    await createMerchOrder(
      1,
      'cs_1',
      {},
      [
        {
          variant: print.variant,
          customizationOptions: print,
          state: MerchItemState.AWAITING_PRINTFILE,
        },
      ],
      'Standard'
    );

    expect(OrderConfirmationTemplate.createTemplatedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@b.c',
        templateContext: expect.objectContaining({
          itemsSummary: '1 × 8×12 in print (AI colorized)',
        }) as unknown,
      })
    );
    expect(OrderCustomizeTemplate.createTemplatedEmail).not.toHaveBeenCalled();
    expect(EmailService.sendTemplateEmail).toHaveBeenCalledWith(
      'confirmation-email'
    );
    expect(saved).toContainEqual(
      expect.objectContaining({
        providerShippingMethod: 'Standard',
        provider: MerchProvider.PRODIGI,
      })
    );
    const items = saved.find(Array.isArray) as Array<Record<string, unknown>>;
    expect(items[0]).toMatchObject({
      internalVariant: print.variant,
      customizationOptions: print,
      state: MerchItemState.AWAITING_PRINTFILE,
    });
  });

  it('keeps the customization email for tote bags', async () => {
    selectProvider.mockReturnValue(MerchProvider.PRINTFUL);
    jest.mocked(getFulfillmentProvider).mockReturnValue({
      sendsCustomizationEmail: true,
      createOrder: () => Promise.resolve({ providerOrderId: '1' }),
    } as never);

    await createMerchOrder(1, 'cs_2', {}, [
      { variant: MerchInternalVariant.TOTE_BAG_SMALL },
    ]);

    expect(EmailService.sendTemplateEmail).toHaveBeenCalledWith(
      'customize-email'
    );
    expect(
      OrderConfirmationTemplate.createTemplatedEmail
    ).not.toHaveBeenCalled();
  });
});
