import type Stripe from 'stripe';
import MerchInternalVariant from '../../enum/MerchInternalVariant';
import { getCatalogDefaultPrice } from './checkoutSession';
import { getAvailableProducts, getMerchProductId } from './ProductRegistry';

jest.mock('../../third-party/stripe', () => ({
  __esModule: true,
  default: { products: { retrieve: jest.fn() } },
}));
jest.mock('./checkoutSession', () => ({
  getCatalogDefaultPrice: jest.fn(),
}));

const mockGetCatalogDefaultPrice = jest.mocked(getCatalogDefaultPrice);

const price = (unitAmount: number): Stripe.Price =>
  ({ unit_amount: unitAmount, currency: 'usd' }) as unknown as Stripe.Price;

describe('ProductRegistry.getAvailableProducts price cache', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    mockGetCatalogDefaultPrice.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('reuses a product price within the cache lifetime', async () => {
    mockGetCatalogDefaultPrice.mockResolvedValue(price(1900));

    const first = await getAvailableProducts([MerchInternalVariant.PRINT_4X6]);
    const second = await getAvailableProducts([MerchInternalVariant.PRINT_4X6]);

    expect(first).toEqual(second);
    expect(mockGetCatalogDefaultPrice).toHaveBeenCalledTimes(1);
    expect(mockGetCatalogDefaultPrice).toHaveBeenCalledWith(
      getMerchProductId(MerchInternalVariant.PRINT_4X6)
    );
  });

  it('refreshes the price after the cache lifetime', async () => {
    mockGetCatalogDefaultPrice.mockResolvedValue(price(1900));
    await getAvailableProducts([MerchInternalVariant.PRINT_8X12]);

    jest.advanceTimersByTime(5 * 60 * 1000 + 1);
    mockGetCatalogDefaultPrice.mockResolvedValue(price(2100));

    const products = await getAvailableProducts([
      MerchInternalVariant.PRINT_8X12,
    ]);

    expect(products[0].priceAmount).toBe(2100);
    expect(mockGetCatalogDefaultPrice).toHaveBeenCalledTimes(2);
  });

  it('returns the stale price when refreshing it fails', async () => {
    mockGetCatalogDefaultPrice.mockResolvedValue(price(1900));
    await getAvailableProducts([MerchInternalVariant.FRAMED_PRINT_8X12_WALL]);

    jest.advanceTimersByTime(5 * 60 * 1000 + 1);
    mockGetCatalogDefaultPrice.mockRejectedValue(new Error('Stripe is down'));

    const products = await getAvailableProducts([
      MerchInternalVariant.FRAMED_PRINT_8X12_WALL,
    ]);

    expect(products[0].priceAmount).toBe(1900);
  });

  it('throws when there is no cached price and Stripe fails', async () => {
    mockGetCatalogDefaultPrice.mockRejectedValue(new Error('Stripe is down'));

    await expect(
      getAvailableProducts([MerchInternalVariant.FRAMED_PRINT_5X7_EASEL])
    ).rejects.toThrow('Stripe is down');
  });
});
