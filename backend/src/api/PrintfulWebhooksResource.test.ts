import express from 'express';
import type { AddressInfo } from 'node:net';
import { AppDataSource } from '../createConnection';
import * as MerchOrderService from '../business/merch/MerchOrderService';
import { getOrder, getShipments } from '../business/utils/printfulApi';
import MerchProvider from '../enum/MerchProvider';
import router from './PrintfulWebhooksResource';

jest.mock('../createConnection', () => {
  const findOneBy = jest.fn();
  return { AppDataSource: { getRepository: () => ({ findOneBy }) } };
});
jest.mock('../business/utils/printfulApi', () => ({
  getOrder: jest.fn(),
  getShipments: jest.fn(),
}));
jest.mock('../business/merch/MerchOrderService', () => ({
  onPrinterStatusChanged: jest.fn(),
  onShipmentSent: jest.fn(),
}));

const findOneBy = jest.mocked(
  AppDataSource.getRepository('MerchOrder').findOneBy
);
const mockGetOrder = getOrder as jest.Mock;
const mockGetShipments = getShipments as jest.Mock;
const onShipmentSent = jest.mocked(MerchOrderService.onShipmentSent);

const FETCHED_URL = 'https://tracking.example.com/real';

const server = express()
  .use(express.json())
  .use('/printful-webhooks', router)
  .listen(0);
const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/printful-webhooks`;

async function postShipmentSent(): Promise<number> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'shipment_sent',
      data: {
        shipment: { id: 7, tracking_url: 'https://attacker.example.com' },
        order: { id: 42, status: 'fulfilled' },
      },
    }),
  });
  return res.status;
}

beforeEach(() => {
  jest.clearAllMocks();
  findOneBy.mockResolvedValue({ id: 1 });
  mockGetOrder.mockResolvedValue({
    data: { data: { id: 42, status: 'fulfilled' } },
    status: 200,
  });
  mockGetShipments.mockResolvedValue({
    data: {
      data: [{ shipped_at: '2026-01-02T00:00:00Z', tracking_url: FETCHED_URL }],
    },
    status: 200,
  });
});

afterAll(() => server.close());

it('emails the tracking link fetched from Printful, not the one in the body', async () => {
  await expect(postShipmentSent()).resolves.toBe(200);
  expect(onShipmentSent).toHaveBeenCalledWith(
    MerchProvider.PRINTFUL,
    '42',
    FETCHED_URL
  );
});

it('does nothing for an order we do not have', async () => {
  findOneBy.mockResolvedValue(null);
  await expect(postShipmentSent()).resolves.toBe(200);
  expect(mockGetOrder).not.toHaveBeenCalled();
  expect(onShipmentSent).not.toHaveBeenCalled();
});

it('answers 503 when Printful cannot be reached, so Printful retries', async () => {
  mockGetOrder.mockResolvedValue({ error: {}, status: 500 });
  await expect(postShipmentSent()).resolves.toBe(503);
  expect(onShipmentSent).not.toHaveBeenCalled();
});
