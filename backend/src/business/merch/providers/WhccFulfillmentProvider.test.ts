import type MerchOrder from '../../../entities/MerchOrder';
import { buildConfiguredProducts } from '../../whcc/buildConfiguredProducts';
import * as WhccApi from '../../whcc/whccApi';
import WhccFulfillmentProvider from './WhccFulfillmentProvider';

jest.mock('../../whcc/whccApi');
jest.mock('../../whcc/buildConfiguredProducts');
jest.mock('../../whcc/buildWhccSubmission', () => ({
  buildWhccConfiguredProducts: jest.fn(() => []),
  buildWhccSubmission: jest.fn(() => ({})),
  getWhccReference: (id: number) => `dev-merch-order-${id}`,
}));
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
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (originalStage === undefined) {
      delete process.env.STAGE;
    } else {
      process.env.STAGE = originalStage;
    }
  });

  it('submits an approved order to WHCC', async () => {
    jest.mocked(WhccApi.listSubmissions).mockResolvedValue({ submissions: [] });
    jest
      .mocked(buildConfiguredProducts)
      .mockResolvedValue([{ configuredProductId: 'cp_1' }] as Awaited<
        ReturnType<typeof buildConfiguredProducts>
      >);
    jest
      .mocked(WhccApi.calculate)
      .mockResolvedValue({ validation: { isValidForSubmit: true } });
    jest
      .mocked(WhccApi.submit)
      .mockResolvedValue({ id: 'sub_9' } as Awaited<
        ReturnType<typeof WhccApi.submit>
      >);

    await expect(
      WhccFulfillmentProvider.submitOrderForFulfillment({ id: 7 } as MerchOrder)
    ).resolves.toEqual({ providerOrderId: 'sub_9' });
    expect(WhccApi.submit).toHaveBeenCalledTimes(1);
  });
});
