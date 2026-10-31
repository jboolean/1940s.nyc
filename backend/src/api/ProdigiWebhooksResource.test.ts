import type { Request, Response } from 'express';
import * as ProdigiCallbackService from '../business/prodigi/ProdigiCallbackService';
import { createCallbackToken } from '../business/prodigi/prodigiCallbackAuth';
import router from './ProdigiWebhooksResource';

jest.mock('../business/prodigi/ProdigiCallbackService', () => ({
  handleOrderCallback: jest.fn(),
}));

type Handler = (req: Request, res: Response) => Promise<void>;

async function post(
  merchOrderId: string,
  token: string,
  body: unknown
): Promise<number> {
  const layer = (
    router as unknown as {
      stack: Array<{ route: { stack: Array<{ handle: Handler }> } }>;
    }
  ).stack[0];
  let status = 0;
  const res = {
    status: (s: number) => {
      status = s;
      return { send: jest.fn() };
    },
  };
  await layer.route.stack[0].handle(
    { params: { merchOrderId, token }, body } as unknown as Request,
    res as unknown as Response
  );
  return status;
}

const event = {
  specversion: '1.0',
  type: 'com.prodigi.order.status.stage.changed#InProgress',
  source: 'x',
  id: '1',
  time: 't',
  datacontenttype: 'application/json',
  subject: 'ord_1',
  data: { order: { id: 'ord_1' } },
};

describe('Prodigi webhook', () => {
  const handle = jest.mocked(ProdigiCallbackService.handleOrderCallback);

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'secret';
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('rejects a bad token without touching anything', async () => {
    expect(await post('5', 'nope', event)).toBe(401);
    expect(await post('5', createCallbackToken(6), event)).toBe(401);
    expect(await post('abc', createCallbackToken(5), event)).toBe(401);
    expect(handle).not.toHaveBeenCalled();
  });

  it('rejects unparseable bodies', async () => {
    expect(await post('5', createCallbackToken(5), { hello: 'x' })).toBe(400);
    expect(handle).not.toHaveBeenCalled();
  });

  it('processes a valid callback', async () => {
    handle.mockResolvedValue('processed');
    expect(await post('5', createCallbackToken(5), event)).toBe(200);
    expect(handle).toHaveBeenCalledWith(5, 'ord_1');
  });

  it('asks Prodigi to retry when the order is not recorded yet', async () => {
    handle.mockResolvedValue('retry');
    expect(await post('5', createCallbackToken(5), event)).toBe(503);
  });
});
