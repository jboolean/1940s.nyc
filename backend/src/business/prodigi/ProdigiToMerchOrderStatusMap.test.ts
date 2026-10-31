import type { Order } from 'prodigi-print-api';
import MerchOrderFulfillmentState from '../../enum/MerchOrderFulfillmentState';
import prodigiOrderToFulfillmentState from './ProdigiToMerchOrderStatusMap';

function order(overrides: {
  stage?: 'InProgress' | 'Complete' | 'Cancelled';
  issues?: unknown[];
  details?: Partial<Order['status']['details']>;
  dispatched?: boolean;
}): Order {
  return {
    status: {
      stage: overrides.stage ?? 'InProgress',
      issues: overrides.issues ?? [],
      details: {
        downloadAssets: 'Complete',
        printReadyAssetsPrepared: 'Complete',
        allocateProductionLocation: 'Complete',
        inProduction: 'InProgress',
        shipping: 'NotStarted',
        ...overrides.details,
      },
    },
    shipments: overrides.dispatched ? [{ dispatchDate: '2026-01-01' }] : [],
  } as unknown as Order;
}

describe('prodigiOrderToFulfillmentState', () => {
  const S = MerchOrderFulfillmentState;
  it.each([
    ['cancelled', order({ stage: 'Cancelled' }), S.CANCELED],
    ['complete', order({ stage: 'Complete' }), S.FULFILLED],
    ['asset error', order({ details: { downloadAssets: 'Error' } }), S.FAILED],
    ['issue', order({ issues: [{}] }), S.ON_HOLD],
    ['partially shipped', order({ dispatched: true }), S.PARTIAL],
    [
      'not started',
      order({ details: { downloadAssets: 'NotStarted' } }),
      S.PENDING,
    ],
    ['in production', order({}), S.IN_PROGRESS],
  ])('%s', (_name, o, expected) => {
    expect(prodigiOrderToFulfillmentState(o)).toBe(expected);
  });
});
