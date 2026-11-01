import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import MerchOrder from '../../entities/MerchOrder';
import MerchOrderItem from '../../entities/MerchOrderItem';
import User from '../../entities/User';
import MerchItemState from '../../enum/MerchItemState';
import MerchOrderFulfillmentState from '../../enum/MerchOrderFulfillmentState';
import MerchOrderState from '../../enum/MerchOrderState';
import MerchProvider from '../../enum/MerchProvider';
import { exceptionClause } from './MerchOrderService';

// Imported for the query alone; the service pulls in the email and printer clients, which want
// credentials at import time.
jest.mock('../email/EmailService', () => ({
  __esModule: true,
  default: { sendTemplateEmail: jest.fn() },
}));
jest.mock('../users/UserService', () => ({
  createMagicLinkUrl: jest.fn(() => 'http://dev.1940s.nyc:3000/orders'),
  getUser: jest.fn(),
}));
jest.mock('../utils/printfulApi', () => ({}));

// The clause puts a provider list into raw SQL, and an empty list written that way renders
// "in ()", which is a Postgres error rather than an empty match. Building the clause against real
// metadata and reading the parameters is what catches that; the branches read correctly either way.
// The parameters are expanded, as they are when the query runs, so the empty list is visible.
async function readQuery(
  noReview: MerchProvider[]
): Promise<[sql: string, params: unknown[]]> {
  const dataSource = new DataSource({
    type: 'postgres',
    entities: [MerchOrder, MerchOrderItem, User],
    namingStrategy: new SnakeNamingStrategy(),
  });
  await (
    dataSource as unknown as { buildMetadatas(): Promise<void> }
  ).buildMetadatas();
  const [sql, params] = dataSource
    .createQueryBuilder(MerchOrder, 'order')
    .leftJoin('order.items', 'items')
    .select('order.id')
    .where('order.state != :canceled', {
      canceled: MerchOrderState.CANCELED,
    })
    .andWhere(exceptionClause(new Date(0), noReview))
    .getQueryAndParameters();
  // Never initialized, so there is no connection to close.
  return [sql, params];
}

describe('merch order exceptions query', () => {
  it('raises a stuck submitting order for every provider', async () => {
    const [sql, params] = await readQuery([]);
    expect(params).toContain(MerchOrderState.SUBMITTING);
    // The pending_submission half is the only thing needing a provider list, so with no provider
    // submitting on its own it is dropped whole rather than written empty.
    expect(params).not.toContain(MerchOrderState.PENDING_SUBMISSION);
    expect(sql).not.toContain('in ()');
  });

  it('adds the pending_submission half only for providers without review', async () => {
    const [, params] = await readQuery([MerchProvider.PRINTFUL]);
    expect(params).toContain(MerchProvider.PRINTFUL);
    expect(params).toContain(MerchOrderState.PENDING_SUBMISSION);
  });

  it('still raises every non-submission exception', async () => {
    const [, params] = await readQuery([]);
    expect(params).toEqual(
      expect.arrayContaining([
        MerchOrderState.CANCELED,
        MerchOrderState.SUBMITTED_FOR_FULFILLMENT,
        MerchOrderFulfillmentState.FAILED,
        MerchOrderFulfillmentState.ON_HOLD,
        MerchItemState.PRINTFILE_FAILED,
      ])
    );
    // The stuck-before date is bound, so a submitter that died leaves its order raised.
    expect(params.some((p) => p instanceof Date)).toBe(true);
  });

  it('reads the state a print file failure leaves behind', () => {
    // The constant is what the admin page filters on, so a rename has to reach the query.
    expect(MerchItemState.PRINTFILE_FAILED).toBe('printfile_failed');
  });
});
