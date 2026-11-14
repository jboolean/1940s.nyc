import MerchOrderFulfillmentState from '../../enum/MerchOrderFulfillmentState';
import type { Submission } from './whccApi';
import whccSubmissionToFulfillmentState from './WhccToMerchOrderStatusMap';

function submission(
  status: Submission['status'],
  ...orders: string[]
): Submission {
  return { id: 'sub_1', status, orders: orders.map((s) => ({ status: s })) };
}

it('maps submissions that are not placed yet or failed from their own status', () => {
  expect(whccSubmissionToFulfillmentState(submission('submitting'))).toBe(
    MerchOrderFulfillmentState.PENDING
  );
  expect(whccSubmissionToFulfillmentState(submission('partially_failed'))).toBe(
    MerchOrderFulfillmentState.FAILED
  );
});

it('combines the status of every WHCC order in a placed submission', () => {
  const map = (...o: string[]): MerchOrderFulfillmentState =>
    whccSubmissionToFulfillmentState(submission('placed', ...o));
  expect(map('order_shipped', 'order_canceled')).toBe(
    MerchOrderFulfillmentState.FULFILLED
  );
  expect(map('order_shipped', 'order_received')).toBe(
    MerchOrderFulfillmentState.PARTIAL
  );
  expect(map('order_received')).toBe(MerchOrderFulfillmentState.IN_PROGRESS);
  expect(map('order_placed')).toBe(MerchOrderFulfillmentState.PENDING);
  expect(map('order_canceled')).toBe(MerchOrderFulfillmentState.CANCELED);
});
