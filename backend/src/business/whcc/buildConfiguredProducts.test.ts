import {
  buildConfiguredProducts,
  buildConfiguredProductsInOrder,
} from './buildConfiguredProducts';
import * as WhccApi from './whccApi';

jest.mock('./whccApi');

const createConfiguredProducts = jest.mocked(WhccApi.createConfiguredProducts);
const pollConfiguredProducts = jest.mocked(WhccApi.pollConfiguredProducts);

const request = (productId: string): WhccApi.ConfiguredProductRequest => ({
  productId,
  selections: { quantity: 1 },
});

const item = (
  status: 'processing' | 'ready',
  configuredProductId = 'CF_1'
): WhccApi.ConfiguredProduct => ({
  configuredProductId,
  status,
});

beforeEach(() => {
  jest.useFakeTimers();
  jest.resetAllMocks();
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

describe('buildConfiguredProductsInOrder', () => {
  it('returns products in request order when the creates finish in another order', async () => {
    createConfiguredProducts.mockImplementation(async ([product]) => {
      const id = product.productId;
      const delay = { '4x6': 300, '8x12': 200, '5x7': 100 }[id] ?? 0;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return { items: [item('ready', `CF_${id}`)] };
    });

    const result = buildConfiguredProductsInOrder(
      [request('4x6'), request('8x12'), request('5x7')],
      Date.now() + 60_000
    );
    await jest.advanceTimersByTimeAsync(1_000);

    await expect(result).resolves.toEqual([
      item('ready', 'CF_4x6'),
      item('ready', 'CF_8x12'),
      item('ready', 'CF_5x7'),
    ]);
    expect(createConfiguredProducts).toHaveBeenCalledTimes(3);
  });

  it('fails when WHCC returns anything but one product for a request', async () => {
    createConfiguredProducts.mockResolvedValue({
      items: [item('ready', 'CF_a'), item('ready', 'CF_b')],
    });
    await expect(
      buildConfiguredProductsInOrder([request('4x6')], Date.now() + 60_000)
    ).rejects.toThrow('2 products for one request');
  });
});
