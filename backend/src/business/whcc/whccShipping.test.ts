import MerchInternalVariant from '../../enum/MerchInternalVariant';
import * as WhccApi from './whccApi';
import { quoteWhccShipping } from './whccShipping';

jest.mock('./whccApi');

const createConfiguredProducts = jest.mocked(WhccApi.createConfiguredProducts);
const calculate = jest.mocked(WhccApi.calculate);

beforeEach(() => {
  jest.resetAllMocks();
  // WHCC returns the products of a create call in any order, here reversed.
  createConfiguredProducts.mockImplementation((products) =>
    Promise.resolve({
      items: products
        .map((p) => ({
          configuredProductId: `CF_${p.images?.[0].url}`,
          status: 'ready' as const,
        }))
        .reverse(),
    })
  );
  calculate.mockResolvedValue({
    validation: { isValidForSubmit: true },
    options: {
      shipping: [
        {
          priority: 'dropship_lowest_cost',
          label: 'Economy',
          price: { value: '9.95', code: 'USD' },
        },
      ],
    },
  });
});

it('quotes each variant with its own total quantity', async () => {
  await quoteWhccShipping([
    {
      variant: MerchInternalVariant.PRINT_4X6,
      quantity: 2,
      print: { photoIdentifier: 'a' },
    },
    {
      variant: MerchInternalVariant.PRINT_8X12,
      quantity: 5,
      print: { photoIdentifier: 'b' },
    },
    {
      variant: MerchInternalVariant.PRINT_4X6,
      quantity: 1,
      print: { photoIdentifier: 'c' },
    },
  ]);

  expect(calculate.mock.calls[0][0].items).toEqual([
    {
      configuredProductId: 'CF_https://photos.1940s.nyc/jpg/a.jpg',
      quantity: 3,
    },
    {
      configuredProductId: 'CF_https://photos.1940s.nyc/jpg/b.jpg',
      quantity: 5,
    },
  ]);
});
