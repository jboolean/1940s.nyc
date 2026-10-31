import type { Request, Response } from 'express';
import * as MerchOrderService from '../business/merch/MerchOrderService';
import router from './PrintfulWebhooksResource';

jest.mock('../business/merch/MerchOrderService', () => ({
  onShipmentSent: jest.fn(),
  onPrinterStatusChanged: jest.fn(),
}));
jest.mock('../business/merch/PrintfulToMerchOrderStatusMap', () => ({}));
jest.mock('../third-party/printful/client', () => ({}));

type Handler = (req: Request, res: Response) => Promise<void>;

async function post(body: unknown): Promise<jest.Mock> {
  const layer = (
    router as unknown as {
      stack: Array<{ route: { stack: Array<{ handle: Handler }> } }>;
    }
  ).stack[0];
  const send = jest.fn();
  const res = { status: jest.fn().mockReturnValue({ send }) };
  await layer.route.stack[0].handle(
    { body } as Request,
    res as unknown as Response
  );
  return res.status;
}

describe('Printful shipment_sent webhook', () => {
  beforeEach(() => jest.clearAllMocks());

  it('passes the shipment id through', async () => {
    await post({
      type: 'shipment_sent',
      data: {
        order: { id: 1 },
        shipment: { id: 2, tracking_url: 'u', tracking_number: 'n' },
      },
    });
    expect(MerchOrderService.onShipmentSent).toHaveBeenCalledWith(
      'printful',
      '1',
      { providerShipmentId: '2', trackingUrl: 'u', trackingNumber: 'n' }
    );
  });

  it('acknowledges but does not record a shipment without an id', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const status = await post({
      type: 'shipment_sent',
      data: { order: { id: 1 }, shipment: { tracking_url: 'u' } },
    });
    expect(MerchOrderService.onShipmentSent).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(200);
  });
});
