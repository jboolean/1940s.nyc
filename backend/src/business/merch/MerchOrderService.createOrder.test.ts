import MerchInternalVariant from '../../enum/MerchInternalVariant';
import MerchItemState from '../../enum/MerchItemState';
import MerchProvider from '../../enum/MerchProvider';
import EmailService from '../email/EmailService';
import { createMerchOrder, NewOrderItem } from './MerchOrderService';
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
  findOneBy: jest.fn(() => Promise.resolve(null)),
};

jest.mock('../../createConnection', () => ({
  AppDataSource: {
    getRepository: () => repo,
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

const print: NewOrderItem = {
  variant: MerchInternalVariant.PRINT_HPR_8X12,
  customizationOptions: {
    variant: MerchInternalVariant.PRINT_HPR_8X12,
    photoIdentifier: 'p1',
    colorize: true,
  },
  // Prints arrive fully specified, so they are never the ones held for customization.
  state: MerchItemState.CUSTOMIZED,
};

describe('createMerchOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    saved.length = 0;
  });

  it('does not fail or roll back the order when the confirmation email fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    selectProvider.mockReturnValue(MerchProvider.PRODIGI);
    jest.mocked(getFulfillmentProvider).mockReturnValue({
      createOrder: () => Promise.resolve({}),
    } as never);
    jest
      .mocked(EmailService.sendTemplateEmail)
      .mockRejectedValueOnce(new Error('postmark'));

    await expect(
      createMerchOrder(1, 'cs_3', {}, [print], 'Standard')
    ).resolves.toMatchObject({ id: 7 });
  });

  it('records the shipping address when the provider creates its order now', async () => {
    selectProvider.mockReturnValue(MerchProvider.PRINTFUL);
    jest.mocked(getFulfillmentProvider).mockReturnValue({
      sendsCustomizationEmail: false,
      createOrder: () => Promise.resolve({ providerOrderId: 'pf_1' }),
    } as never);

    await createMerchOrder(1, 'cs_4', { line1: '1 Main St' }, [print]);

    const savedOrder = saved[1] as {
      providerOrderId?: string;
      shippingAddress?: unknown;
    };
    expect(savedOrder.providerOrderId).toBe('pf_1');
    expect(savedOrder.shippingAddress).toEqual({ line1: '1 Main St' });
  });

  it('returns the existing order for a checkout session it has already seen', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    repo.findOneBy.mockResolvedValueOnce({ id: 42 } as never);
    const provider = { createOrder: jest.fn() };
    jest.mocked(getFulfillmentProvider).mockReturnValue(provider as never);

    await expect(
      createMerchOrder(1, 'cs_dup', {}, [{ variant: print.variant }])
    ).resolves.toEqual({ id: 42 });
    expect(provider.createOrder).not.toHaveBeenCalled();
  });
});
