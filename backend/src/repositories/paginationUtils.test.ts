import type { SelectQueryBuilder } from 'typeorm';
import { getPaginated, MAX_PAGE_SIZE } from './paginationUtils';

type Row = { id: number };

function fakeQueryBuilder(rowCount: number): {
  qb: SelectQueryBuilder<Row>;
  take: jest.Mock<void, [number]>;
} {
  const take = jest.fn<void, [number]>();
  const qb = {
    alias: 'row',
    expressionMap: { wheres: [] },
    clone: () => qb,
    getCount: () => Promise.resolve(rowCount),
    orderBy: () => qb,
    where: () => qb,
    andWhere: () => qb,
    take: (n: number) => {
      take(n);
      return qb;
    },
    getMany: () =>
      Promise.resolve(
        Array.from(
          { length: Math.min(rowCount, take.mock.calls[0][0]) },
          (_, i) => ({ id: i })
        )
      ),
  };
  return { qb: qb as unknown as SelectQueryBuilder<Row>, take };
}

const options = {
  key: 'id' as const,
  sortDirection: 'ASC' as const,
  getSerializedToken: (row: Row) => String(row.id),
  deserializeToken: (token: string) => Number(token),
};

describe('getPaginated', () => {
  it('clamps page sizes above the maximum', async () => {
    const { qb, take } = fakeQueryBuilder(2000);

    const page = await getPaginated(qb, options, { pageSize: 1000 });

    expect(take).toHaveBeenCalledWith(MAX_PAGE_SIZE + 1);
    expect(page.items).toHaveLength(MAX_PAGE_SIZE);
    expect(page.hasNextPage).toBe(true);
    expect(page.nextToken).toBe(String(MAX_PAGE_SIZE - 1));
  });

  it('keeps page sizes up to the maximum', async () => {
    const { qb, take } = fakeQueryBuilder(2000);

    const page = await getPaginated(qb, options, { pageSize: 500 });

    expect(take).toHaveBeenCalledWith(501);
    expect(page.items).toHaveLength(500);
  });
});
