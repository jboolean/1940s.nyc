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
