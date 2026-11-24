import { AppDataSource } from '../../createConnection';
import MerchOrderFulfillmentState from '../../enum/MerchOrderFulfillmentState';
import MerchProvider from '../../enum/MerchProvider';
import { getOrder, getShipments } from '../utils/printfulApi';
import * as MerchOrderService from './MerchOrderService';
import { handleOrderWebhook } from './PrintfulCallbackService';

jest.mock('../../createConnection', () => {
  const findOneBy = jest.fn();
  return {
    AppDataSource: { getRepository: () => ({ findOneBy }) },
  };
});
jest.mock('../utils/printfulApi', () => ({
  getOrder: jest.fn(),
  getShipments: jest.fn(),
}));
jest.mock('./MerchOrderService', () => ({
  onPrinterStatusChanged: jest.fn(),
  onShipmentSent: jest.fn(),
}));

const findOneBy = jest.mocked(
  AppDataSource.getRepository('MerchOrder').findOneBy
);
const mockGetOrder = getOrder as jest.Mock;
const mockGetShipments = getShipments as jest.Mock;
const onPrinterStatusChanged = jest.mocked(
  MerchOrderService.onPrinterStatusChanged
);
const onShipmentSent = jest.mocked(MerchOrderService.onShipmentSent);

const FETCHED_URL = 'https://tracking.example.com/real';

beforeEach(() => {
  jest.clearAllMocks();
  findOneBy.mockResolvedValue({ id: 1 });
  mockGetOrder.mockResolvedValue({
    data: { data: { id: 42, status: 'fulfilled' } },
    status: 200,
  });
  mockGetShipments.mockResolvedValue({
    data: {
      data: [
        {
          shipped_at: '2026-01-01T00:00:00Z',
          tracking_url: 'https://tracking.example.com/old',
        },
        { shipped_at: '2026-01-02T00:00:00Z', tracking_url: FETCHED_URL },
        { shipped_at: null, tracking_url: 'https://tracking.example.com/no' },
      ],
    },
    status: 200,
  });
});

it('uses the status and tracking URL fetched from Printful', async () => {
  await expect(handleOrderWebhook(42, true)).resolves.toBe(true);

  expect(mockGetOrder).toHaveBeenCalledWith({ path: { order_id: 42 } });
  expect(onPrinterStatusChanged).toHaveBeenCalledWith(
    MerchProvider.PRINTFUL,
    '42',
    MerchOrderFulfillmentState.FULFILLED
  );
  expect(onShipmentSent).toHaveBeenCalledTimes(1);
  expect(onShipmentSent).toHaveBeenCalledWith(
    MerchProvider.PRINTFUL,
    '42',
    FETCHED_URL
  );
});

it('does not look up shipments for an order update', async () => {
  await expect(handleOrderWebhook(42, false)).resolves.toBe(true);

  expect(onPrinterStatusChanged).toHaveBeenCalled();
  expect(mockGetShipments).not.toHaveBeenCalled();
  expect(onShipmentSent).not.toHaveBeenCalled();
});

it('does nothing for an order we do not know', async () => {
  findOneBy.mockResolvedValue(null);

  await expect(handleOrderWebhook(999, true)).resolves.toBe(true);

  expect(mockGetOrder).not.toHaveBeenCalled();
  expect(onPrinterStatusChanged).not.toHaveBeenCalled();
  expect(onShipmentSent).not.toHaveBeenCalled();
});

it('does nothing for an order Printful does not have', async () => {
  mockGetOrder.mockResolvedValue({ error: {}, status: 404 });

  await expect(handleOrderWebhook(42, true)).resolves.toBe(true);

  expect(onPrinterStatusChanged).not.toHaveBeenCalled();
  expect(onShipmentSent).not.toHaveBeenCalled();
});

it('asks for a retry when Printful cannot be reached', async () => {
  mockGetOrder.mockResolvedValue({ error: {}, status: 500 });

  await expect(handleOrderWebhook(42, true)).resolves.toBe(false);

  expect(onPrinterStatusChanged).not.toHaveBeenCalled();
});
