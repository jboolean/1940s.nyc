import registerWhccWebhooks from './registerWhccWebhooks';
import {
  createEventSubscription,
  enableEventSubscription,
  listEventSubscriptions,
} from './whccApi';

jest.mock('./whccApi');

const EVENT_TYPES = [
  'order.accepted',
  'order.rejected',
  'order.shipped',
  'order.cancelled',
];

function subscription(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    id: 'SUB_existing',
    status: 'active',
    eventTypes: EVENT_TYPES,
    destination: {
      type: 'webhook',
      callbackUri: 'https://api.1940s.nyc/whcc-webhooks',
      version: 2,
    },
    ...overrides,
  };
}

function mockSubscriptions(items: unknown[]): void {
  (listEventSubscriptions as jest.Mock).mockResolvedValue({ items });
}

describe('registerWhccWebhooks', () => {
  const originalStage = process.env.STAGE;
  const originalSecret = process.env.WHCC_SIGNING_SECRET;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.WHCC_SIGNING_SECRET = 'signing-secret';
    (createEventSubscription as jest.Mock).mockResolvedValue({ id: 'SUB_new' });
  });

  afterAll(() => {
    process.env.STAGE = originalStage;
    process.env.WHCC_SIGNING_SECRET = originalSecret;
  });

  it('creates and enables a subscription on the production host in production when none exists', async () => {
    process.env.STAGE = 'production';
    mockSubscriptions([]);

    await registerWhccWebhooks();

    expect(createEventSubscription).toHaveBeenCalledTimes(1);
    expect(createEventSubscription).toHaveBeenCalledWith(
      {
        destination: {
          type: 'webhook',
          callbackUri: 'https://api.1940s.nyc/whcc-webhooks',
          version: 2,
        },
        eventTypes: EVENT_TYPES,
        description: 'fourtiesnyc',
        signingSecret: 'signing-secret',
      },
      expect.any(String)
    );
    expect(enableEventSubscription).toHaveBeenCalledWith('SUB_new');
  });

  it('creates a subscription on the staging host in staging even when production has one', async () => {
    process.env.STAGE = 'staging';
    mockSubscriptions([subscription()]);

    await registerWhccWebhooks();

    expect(
      JSON.stringify(jest.mocked(createEventSubscription).mock.calls)
    ).toContain('https://api.staging.1940s.nyc/whcc-webhooks');
  });

  it('does nothing when an active matching subscription exists', async () => {
    process.env.STAGE = 'production';
    mockSubscriptions([subscription()]);

    await registerWhccWebhooks();

    expect(createEventSubscription).not.toHaveBeenCalled();
    expect(enableEventSubscription).not.toHaveBeenCalled();
  });

  it('enables a matching subscription that is not active without creating another', async () => {
    process.env.STAGE = 'production';
    mockSubscriptions([subscription({ status: 'disabled' })]);

    await registerWhccWebhooks();

    expect(createEventSubscription).not.toHaveBeenCalled();
    expect(enableEventSubscription).toHaveBeenCalledWith('SUB_existing');
  });

  it('throws instead of creating a duplicate when the endpoint has a subscription with different events', async () => {
    process.env.STAGE = 'production';
    mockSubscriptions([subscription({ eventTypes: ['order.shipped'] })]);

    await expect(registerWhccWebhooks()).rejects.toThrow(
      'different version or event types'
    );
    expect(createEventSubscription).not.toHaveBeenCalled();
  });

  it('does not register in dev', async () => {
    process.env.STAGE = 'dev';

    await registerWhccWebhooks();

    expect(listEventSubscriptions).not.toHaveBeenCalled();
    expect(createEventSubscription).not.toHaveBeenCalled();
  });
});
