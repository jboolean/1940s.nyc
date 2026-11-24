import type { SelectQueryBuilder } from 'typeorm';
import { getPaginated, MAX_PAGE_SIZE } from './paginationUtils';

it('clamps pageSize above the cap', async () => {
  const take = jest.fn<void, [number]>();
  const qb = {
    alias: 'row',
    expressionMap: { wheres: [] },
    clone: () => qb,
    getCount: () => Promise.resolve(0),
    orderBy: () => qb,
    where: () => qb,
    take: (n: number) => {
      take(n);
      return qb;
    },
    getMany: () => Promise.resolve([]),
  };

  await getPaginated(
    qb as unknown as SelectQueryBuilder<{ id: number }>,
    {
      key: 'id',
      sortDirection: 'ASC',
      getSerializedToken: (row) => String(row.id),
      deserializeToken: Number,
    },
    { pageSize: 1000 }
  );

  expect(take).toHaveBeenCalledWith(MAX_PAGE_SIZE + 1);
});
