import * as MerchOrderService from '../business/merch/MerchOrderService';
import { applyProdigiOrder } from '../business/prodigi/ProdigiCallbackService';
import * as ProdigiService from '../business/prodigi/ProdigiService';
import {
  submitPendingProdigiOrders,
  syncSubmittedProdigiOrders,
} from './submitProdigiOrders';

const find = jest.fn();
const getMany = jest.fn();
const update = jest.fn();
const qb: Record<string, unknown> = {};
for (const m of ['where', 'andWhere', 'orderBy', 'limit']) {
  qb[m] = jest.fn(() => qb);
}
qb.getMany = getMany;

jest.mock('../createConnection', () => ({
  AppDataSource: {
    getRepository: () => ({ find, update, createQueryBuilder: () => qb }),
  },
}));
jest.mock('../business/merch/MerchOrderService', () => ({
  submitOrderForFulfillment: jest.fn(),
}));
jest.mock('../business/prodigi/ProdigiCallbackService', () => ({
  applyProdigiOrder: jest.fn(),
}));
jest.mock('../business/prodigi/ProdigiService', () => ({
  getOrder: jest.fn(),
}));

describe('submitPendingProdigiOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('keeps going when one order fails to submit', async () => {
    find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    jest
      .mocked(MerchOrderService.submitOrderForFulfillment)
      .mockRejectedValueOnce(new Error('boom'));
    await submitPendingProdigiOrders();
    expect(MerchOrderService.submitOrderForFulfillment).toHaveBeenCalledTimes(
      2
    );
    expect(console.error).toHaveBeenCalled();
  });
});

describe('syncSubmittedProdigiOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('applies the fetched order and tolerates a missing or failing one', async () => {
    getMany.mockResolvedValue([
      { id: 1, providerOrderId: 'ord_1' },
      { id: 2, providerOrderId: 'ord_2' },
      { id: 3, providerOrderId: 'ord_3' },
    ]);
    jest
      .mocked(ProdigiService.getOrder)
      .mockResolvedValueOnce({ id: 'ord_1' } as never)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('503'));
    await syncSubmittedProdigiOrders();
    expect(applyProdigiOrder).toHaveBeenCalledTimes(1);
    expect(applyProdigiOrder).toHaveBeenCalledWith('ord_1', { id: 'ord_1' });
  });
});
