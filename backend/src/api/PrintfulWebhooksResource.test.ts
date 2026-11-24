import express from 'express';
import type { AddressInfo } from 'node:net';
import * as PrintfulCallbackService from '../business/merch/PrintfulCallbackService';
import router from './PrintfulWebhooksResource';

jest.mock('../business/merch/PrintfulCallbackService', () => ({
  handleOrderWebhook: jest.fn(),
}));

const handleOrderWebhook = jest.mocked(
  PrintfulCallbackService.handleOrderWebhook
);

const server = express()
  .use(express.json())
  .use('/printful-webhooks', router)
  .listen(0);
const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/printful-webhooks`;

const shipmentSent = {
  type: 'shipment_sent',
  created: 1,
  retries: 0,
  store: 1,
  data: {
    shipment: { id: 7, tracking_url: 'https://attacker.example.com' },
    order: { id: 42, status: 'fulfilled' },
  },
};

async function post(body: object): Promise<number> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.status;
}

beforeEach(() => jest.clearAllMocks());
afterAll(() => server.close());

it('passes only the order id on, ignoring the rest of the body', async () => {
  handleOrderWebhook.mockResolvedValue(true);
  await expect(post(shipmentSent)).resolves.toBe(200);
  expect(handleOrderWebhook).toHaveBeenCalledWith(42, true);

  await expect(post({ ...shipmentSent, type: 'order_updated' })).resolves.toBe(
    200
  );
  expect(handleOrderWebhook).toHaveBeenLastCalledWith(42, false);
});

it('answers 200 without doing anything for a body with no order id', async () => {
  await expect(post({ type: 'shipment_sent', data: {} })).resolves.toBe(200);
  await expect(post({ type: 'package_returned' })).resolves.toBe(200);
  expect(handleOrderWebhook).not.toHaveBeenCalled();
});

it('answers 503 when handling fails, so Printful retries it', async () => {
  handleOrderWebhook.mockResolvedValue(false);
  await expect(post(shipmentSent)).resolves.toBe(503);

  handleOrderWebhook.mockRejectedValue(new Error('boom'));
  await expect(post(shipmentSent)).resolves.toBe(503);
});
