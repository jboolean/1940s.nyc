import type MerchOrder from '../../../entities/MerchOrder';
import * as WhccApi from '../../whcc/whccApi';
import WhccFulfillmentProvider from './WhccFulfillmentProvider';

jest.mock('../../whcc/whccApi');
jest.mock('../../whcc/WhccCallbackService', () => ({}));

it('finds a submission again by its reference after a lost response, without resubmitting', async () => {
  jest
    .mocked(WhccApi.listSubmissions)
    .mockResolvedValue({ submissions: [{ id: 'sub_1' }] });

  await expect(
    WhccFulfillmentProvider.submitOrderForFulfillment({ id: 7 } as MerchOrder)
  ).resolves.toEqual({ providerOrderId: 'sub_1' });

  expect(WhccApi.listSubmissions).toHaveBeenCalledWith(
    { reference: 'dev-merch-order-7' },
    expect.any(Number)
  );
  expect(WhccApi.createConfiguredProducts).not.toHaveBeenCalled();
  expect(WhccApi.submit).not.toHaveBeenCalled();
});

describe('in production', () => {
  const originalStage = process.env.STAGE;

  beforeEach(() => {
    process.env.STAGE = 'production';
    delete process.env.WHCC_LIVE_ORDERS_ENABLED;
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (originalStage === undefined) {
      delete process.env.STAGE;
    } else {
      process.env.STAGE = originalStage;
    }
    delete process.env.WHCC_LIVE_ORDERS_ENABLED;
  });

  it.each([undefined, 'false'])(
    'refuses to submit when live orders are not enabled (flag: %s)',
    async (flag) => {
      if (flag !== undefined) {
        process.env.WHCC_LIVE_ORDERS_ENABLED = flag;
      }
      await expect(
        WhccFulfillmentProvider.submitOrderForFulfillment({
          id: 7,
        } as MerchOrder)
      ).rejects.toThrow('WHCC_LIVE_ORDERS_ENABLED is not true');
      expect(WhccApi.listSubmissions).not.toHaveBeenCalled();
      expect(WhccApi.submit).not.toHaveBeenCalled();
    }
  );
});
