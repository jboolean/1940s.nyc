import express from 'express';
import type { AddressInfo } from 'node:net';
import * as ProdigiCallbackService from '../business/prodigi/ProdigiCallbackService';
import router from './ProdigiWebhooksResource';

jest.mock('../business/prodigi/ProdigiCallbackService', () => ({
  handleOrderCallback: jest.fn(),
}));

const handleOrderCallback = jest.mocked(
  ProdigiCallbackService.handleOrderCallback
);

const server = express().use('/prodigi-webhooks', router).listen(0);
const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/prodigi-webhooks`;

const event = {
  specversion: '1.0',
  type: 'com.prodigi.order.status.stage.changed#InProgress',
  source: 'https://api.prodigi.com/v4.0/Orders/ord_1',
  id: 'evt_1',
  time: '2026-01-01T00:00:00Z',
  datacontenttype: 'application/json',
  subject: 'ord_1',
  data: { order: { id: 'ord_1' } },
};

async function post(body: string | object): Promise<number> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  return res.status;
}

afterAll(() => server.close());

it('answers 400 for a body it cannot parse, so Prodigi does not retry it', async () => {
  await expect(post({})).resolves.toBe(400);
  await expect(post('{}')).resolves.toBe(400);
  expect(handleOrderCallback).not.toHaveBeenCalled();
});

it('answers 200 when the callback is handled', async () => {
  handleOrderCallback.mockResolvedValue(true);
  await expect(post(event)).resolves.toBe(200);
  expect(handleOrderCallback).toHaveBeenCalledWith('ord_1', false);
});

it('answers 503 when handling fails, so Prodigi retries it', async () => {
  handleOrderCallback.mockResolvedValue(false);
  await expect(post(event)).resolves.toBe(503);

  handleOrderCallback.mockRejectedValue(new Error('boom'));
  await expect(post(event)).resolves.toBe(503);
});
