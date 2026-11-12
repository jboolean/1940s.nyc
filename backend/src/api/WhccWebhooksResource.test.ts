import express from 'express';
import type { AddressInfo } from 'node:net';
import stripe from '../third-party/stripe';
import * as WhccCallbackService from '../business/whcc/WhccCallbackService';
import router from './WhccWebhooksResource';

jest.mock('../third-party/stripe', () => ({
  __esModule: true,
  default: new (jest.requireActual<typeof import('stripe')>('stripe').default)(
    'sk_test_unused'
  ),
}));
jest.mock('../business/whcc/WhccCallbackService', () => ({
  handleEvent: jest.fn(),
}));

const handleEvent = jest.mocked(WhccCallbackService.handleEvent);

const app = express();
app.use('/whcc-webhooks', express.raw({ type: () => true }));
app.use('/whcc-webhooks', router);
const server = app.listen(0);
const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/whcc-webhooks`;

process.env.WHCC_SIGNING_SECRET = 'a'.repeat(43);
const body = JSON.stringify({
  ConfirmationId: 'c1',
  EventType: 'order.shipped',
});

function sign(
  timestamp: number,
  secret = process.env.WHCC_SIGNING_SECRET as string
): string {
  return stripe.webhooks
    .generateTestHeaderString({ payload: body, secret, timestamp })
    .toUpperCase()
    .replace(/^T=/, 't=')
    .replace(',V1=', ',v1=');
}

async function post(signature: string): Promise<number> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'WHCC-Signature': signature,
    },
    body,
  });
  return res.status;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterAll(() => server.close());

it('rejects a wrong or stale signature without acting', async () => {
  const now = Math.floor(Date.now() / 1000);
  await expect(post(sign(now, 'b'.repeat(43)))).resolves.toBe(401);
  await expect(post(sign(now - 3600))).resolves.toBe(401);
  expect(handleEvent).not.toHaveBeenCalled();
});

it('re-reads the order named by a correctly signed event', async () => {
  await expect(post(sign(Math.floor(Date.now() / 1000)))).resolves.toBe(200);
  expect(handleEvent).toHaveBeenCalledWith('c1');
});
