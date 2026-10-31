const create = jest.fn();
jest.mock('prodigi-print-api', () => ({
  ...jest.requireActual<object>('prodigi-print-api'),
  ProdigiClient: jest.fn().mockImplementation(() => ({
    orders: { create },
  })),
}));

import { createOrder } from './ProdigiService';

describe('ProdigiService.createOrder', () => {
  const request = {} as never;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PRODIGI_SK = 'test';
    delete process.env.PRODIGI_LIVE_ORDERS_ENABLED;
  });

  it('never calls the live API without the flag', async () => {
    process.env.PRODIGI_BASE_URL = 'api.prodigi.com';
    await expect(createOrder(request)).rejects.toThrow(/live API/);
    expect(create).not.toHaveBeenCalled();
  });

  it('creates orders against the sandbox', async () => {
    process.env.PRODIGI_BASE_URL = 'api.sandbox.prodigi.com';
    create.mockResolvedValue({ order: { id: 'ord_1' } });
    await expect(createOrder(request)).resolves.toEqual({ id: 'ord_1' });
  });
});
