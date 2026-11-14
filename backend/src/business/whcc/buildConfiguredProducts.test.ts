import { buildConfiguredProducts } from './buildConfiguredProducts';
import * as WhccApi from './whccApi';

jest.mock('./whccApi');

const createConfiguredProducts = jest.mocked(WhccApi.createConfiguredProducts);
const pollConfiguredProducts = jest.mocked(WhccApi.pollConfiguredProducts);

const item = (status: 'processing' | 'ready'): WhccApi.ConfiguredProduct => ({
  configuredProductId: 'CF_1',
  status,
});

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});
afterEach(() => jest.useRealTimers());

it('polls the returned link until every product is ready', async () => {
  createConfiguredProducts.mockResolvedValue({
    items: [item('processing')],
    pollUrl: 'https://poll',
  });
  pollConfiguredProducts
    .mockResolvedValueOnce({
      items: [item('processing')],
      pollUrl: 'https://poll',
    })
    .mockResolvedValueOnce({ items: [item('ready')] });

  const result = buildConfiguredProducts([], Date.now() + 60_000);
  await jest.advanceTimersByTimeAsync(10_000);

  await expect(result).resolves.toEqual([item('ready')]);
  expect(createConfiguredProducts).toHaveBeenCalledTimes(1);
  expect(pollConfiguredProducts).toHaveBeenCalledTimes(2);
});

it('gives up when the next wait would pass the deadline', async () => {
  createConfiguredProducts.mockResolvedValue({
    items: [item('processing')],
    pollUrl: 'https://poll',
  });
  await expect(buildConfiguredProducts([], Date.now() + 500)).rejects.toThrow(
    'did not finish building'
  );
  expect(pollConfiguredProducts).not.toHaveBeenCalled();
});
