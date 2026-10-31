import { createOrder } from './ProdigiService';

const create = jest.fn();
jest.mock('prodigi-print-api', () => ({
  ...jest.requireActual<object>('prodigi-print-api'),
  ProdigiClient: jest.fn().mockImplementation(() => ({ orders: { create } })),
}));

describe('createOrder', () => {
  const request = {} as never;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PRODIGI_SK = 'test';
    delete process.env.PRODIGI_LIVE_ORDERS_ENABLED;
  });

  it('is blocked on the live API unless explicitly enabled', async () => {
    process.env.STAGE = 'production';
    await expect(createOrder(request)).rejects.toThrow(/live API/);
    expect(create).not.toHaveBeenCalled();

    process.env.PRODIGI_LIVE_ORDERS_ENABLED = 'true';
    create.mockResolvedValue({ order: { id: 'ord_1' } });
    await expect(createOrder(request)).resolves.toEqual({ id: 'ord_1' });
  });

  it('is allowed in the sandbox', async () => {
    process.env.STAGE = 'dev';
    create.mockResolvedValue({ order: { id: 'ord_2' } });
    await expect(createOrder(request)).resolves.toEqual({ id: 'ord_2' });
  });
});
