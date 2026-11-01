import EmailService from '../business/email/EmailService';
import MerchOrdersQueueTemplate from '../business/email/templates/MerchOrdersQueueTemplate';
import {
  getOrdersForReview,
  getOrdersWithExceptions,
} from '../business/merch/MerchOrderService';
import checkMerchQueue from './checkMerchQueue';

jest.mock('../business/email/EmailService', () => ({
  __esModule: true,
  default: { sendTemplateEmail: jest.fn() },
}));
jest.mock('../business/merch/MerchOrderService', () => ({
  getOrdersForReview: jest.fn(),
  getOrdersWithExceptions: jest.fn(),
}));
jest.mock('../business/email/templates/MerchOrdersQueueTemplate', () => ({
  __esModule: true,
  default: { createTemplatedEmail: jest.fn(() => 'queue-email') },
}));

const createTemplatedEmail = jest.mocked(
  MerchOrdersQueueTemplate.createTemplatedEmail
);

function context(): Record<string, unknown> {
  return createTemplatedEmail.mock.calls[0][0].templateContext;
}

describe('checkMerchQueue', () => {
  beforeAll(() => {
    process.env.FRONTEND_BASE_URL = 'http://localhost:3000';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getOrdersForReview).mockResolvedValue([]);
    jest.mocked(getOrdersWithExceptions).mockResolvedValue([]);
  });

  it('sends nothing when neither queue has anything in it', async () => {
    await checkMerchQueue();

    expect(EmailService.sendTemplateEmail).not.toHaveBeenCalled();
  });

  it('sends the exception count on its own, with the orders paragraph left out', async () => {
    jest.mocked(getOrdersWithExceptions).mockResolvedValue([{}, {}] as never);

    await checkMerchQueue();

    expect(EmailService.sendTemplateEmail).toHaveBeenCalledWith('queue-email');
    expect(context()).toMatchObject({
      orders: null,
      exceptions: { count: 2 },
    });
  });

  it('sends both counts when the queue has orders of both kinds', async () => {
    jest.mocked(getOrdersForReview).mockResolvedValue([{}] as never);
    jest.mocked(getOrdersWithExceptions).mockResolvedValue([{}, {}] as never);

    await checkMerchQueue();

    expect(context()).toMatchObject({
      orders: { count: 1 },
      exceptions: { count: 2 },
    });
  });
});
