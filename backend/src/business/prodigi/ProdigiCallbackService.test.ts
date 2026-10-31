import type { Order } from 'prodigi-print-api';
import MerchOrderFulfillmentState from '../../enum/MerchOrderFulfillmentState';
import MerchProvider from '../../enum/MerchProvider';
import * as MerchOrderService from '../merch/MerchOrderService';
import { handleOrderCallback } from './ProdigiCallbackService';
import * as ProdigiService from './ProdigiService';

const findOneBy = jest.fn();
jest.mock('../../createConnection', () => ({
  AppDataSource: { getRepository: () => ({ findOneBy }) },
}));
jest.mock('../merch/MerchOrderService', () => ({
  onPrinterStatusChanged: jest.fn(),
  onShipmentSent: jest.fn(),
}));
jest.mock('./ProdigiService', () => ({ getOrder: jest.fn() }));

const fetched = {
  id: 'ord_1',
  status: {
    stage: 'InProgress',
    issues: [],
    details: {
      downloadAssets: 'Complete',
      printReadyAssetsPrepared: 'Complete',
    },
  },
  shipments: [
    {
      id: 'shp_1',
      dispatchDate: '2026-01-01',
      carrier: { name: 'UPS', service: 'Ground' },
      tracking: { url: 'http://t/1', number: 'Z1' },
    },
    { id: 'shp_2', carrier: { name: 'UPS', service: 'Ground' } },
  ],
} as unknown as Order;

describe('handleOrderCallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    findOneBy.mockResolvedValue({ id: 5, providerOrderId: 'ord_1' });
    jest.mocked(ProdigiService.getOrder).mockResolvedValue(fetched);
  });

  it('acts on the re-fetched order and records dispatched shipments', async () => {
    expect(await handleOrderCallback(5, 'ord_1')).toBe('processed');
    expect(ProdigiService.getOrder).toHaveBeenCalledWith('ord_1');
    expect(MerchOrderService.onPrinterStatusChanged).toHaveBeenCalledWith(
      MerchProvider.PRODIGI,
      'ord_1',
      MerchOrderFulfillmentState.PARTIAL
    );
    expect(MerchOrderService.onShipmentSent).toHaveBeenCalledTimes(1);
    expect(MerchOrderService.onShipmentSent).toHaveBeenCalledWith(
      MerchProvider.PRODIGI,
      'ord_1',
      {
        providerShipmentId: 'shp_1',
        trackingUrl: 'http://t/1',
        trackingNumber: 'Z1',
        carrier: 'UPS',
        readyToEmail: true,
      }
    );
  });

  it('ignores a callback whose order id does not belong to the merch order', async () => {
    expect(await handleOrderCallback(5, 'ord_other')).toBe('ignored');
    expect(ProdigiService.getOrder).not.toHaveBeenCalled();
    expect(MerchOrderService.onPrinterStatusChanged).not.toHaveBeenCalled();
  });

  it('ignores unknown merch orders and orders Prodigi does not return', async () => {
    findOneBy.mockResolvedValueOnce(null);
    expect(await handleOrderCallback(5, 'ord_1')).toBe('ignored');
    expect(MerchOrderService.onPrinterStatusChanged).not.toHaveBeenCalled();
  });

  it('asks for a retry when Prodigi returns 404, as it does for a held order', async () => {
    jest.mocked(ProdigiService.getOrder).mockResolvedValueOnce(undefined);
    expect(await handleOrderCallback(5, 'ord_1')).toBe('retry');
    expect(MerchOrderService.onPrinterStatusChanged).not.toHaveBeenCalled();
  });

  it('defers the shipped email until tracking exists', async () => {
    const untracked = {
      ...fetched,
      shipments: [
        {
          id: 'shp_1',
          dispatchDate: '2026-01-01',
          carrier: { name: 'UPS', service: 'Ground' },
        },
      ],
    } as unknown as Order;
    jest.mocked(ProdigiService.getOrder).mockResolvedValueOnce(untracked);
    await handleOrderCallback(5, 'ord_1');
    expect(MerchOrderService.onShipmentSent).toHaveBeenCalledWith(
      MerchProvider.PRODIGI,
      'ord_1',
      expect.objectContaining({ readyToEmail: false })
    );
  });

  it('emails an untracked shipment once the order is complete', async () => {
    const complete = {
      ...fetched,
      status: { ...fetched.status, stage: 'Complete' },
      shipments: [
        {
          id: 'shp_1',
          dispatchDate: '2026-01-01',
          carrier: { name: 'UPS', service: 'Ground' },
        },
      ],
    } as unknown as Order;
    jest.mocked(ProdigiService.getOrder).mockResolvedValueOnce(complete);
    await handleOrderCallback(5, 'ord_1');
    expect(MerchOrderService.onShipmentSent).toHaveBeenCalledWith(
      MerchProvider.PRODIGI,
      'ord_1',
      expect.objectContaining({ readyToEmail: true })
    );
  });

  it('asks for a retry when the Prodigi order id is not recorded yet', async () => {
    findOneBy.mockResolvedValue({ id: 5 });
    expect(await handleOrderCallback(5, 'ord_1')).toBe('retry');
  });
});
