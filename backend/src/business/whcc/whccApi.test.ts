import { AxiosError, type AxiosResponse } from 'axios';
import { getV1CommerceSubmissionsSubmissionid } from '../../third-party/whcc/client/sdk.gen';
import { getSubmission, WhccApiError } from './whccApi';

jest.mock('../../third-party/whcc/client/sdk.gen', () => ({
  getV1CommerceSubmissionsSubmissionid: jest.fn(),
}));
jest.mock('../../third-party/whcc/client/client.gen', () => ({
  client: { instance: { interceptors: { request: { use: jest.fn() } } } },
}));
jest.mock('../../third-party/whcc/fulfillmentClient/client.gen', () => ({
  client: { instance: { interceptors: { request: { use: jest.fn() } } } },
}));
jest.mock('../../third-party/whcc/fulfillmentClient/sdk.gen', () => ({}));

const send = jest.mocked(getV1CommerceSubmissionsSubmissionid);

function reject(status: number, data: unknown): void {
  send.mockRejectedValue(
    new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, {
      status,
      data,
    } as AxiosResponse)
  );
}

beforeEach(() => {
  process.env.WHCC_SK = 'test-key';
});

it('tells a gateway key rejection from Problem Details, and never rethrows the request config', async () => {
  reject(403, { message: 'Forbidden' });
  await expect(getSubmission('s')).rejects.toMatchObject({
    status: 403,
    gatewayMessage: 'Forbidden',
  });

  reject(409, { title: 'Conflict', code: 'submission.idempotency_conflict' });
  const error = (await getSubmission('s').catch(
    (e: unknown) => e
  )) as WhccApiError;
  expect(error.problem?.code).toBe('submission.idempotency_conflict');

  send.mockRejectedValue(new AxiosError('timeout', 'ECONNABORTED'));
  const timeout = (await getSubmission('s').catch(
    (e: unknown) => e
  )) as WhccApiError;
  expect(timeout).toBeInstanceOf(WhccApiError);
  expect(JSON.stringify(timeout)).not.toContain('test-key');
});
