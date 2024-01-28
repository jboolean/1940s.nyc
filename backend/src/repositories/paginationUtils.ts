import {
  FindOperator,
  IsNull,
  LessThan,
  MoreThan,
  Not,
  ObjectLiteral,
  SelectQueryBuilder,
} from 'typeorm';
import Paginated from '../business/pagination/Paginated';
import PaginationInput from '../business/pagination/PaginationInput';
import PaginationOptions from '../business/pagination/PaginationOptions';

export async function getPaginated<E extends ObjectLiteral>(
  qb: SelectQueryBuilder<E>,
  { key, sortDirection, getKeyValue }: PaginationOptions<E>,
  { pageToken: nextToken, pageSize }: PaginationInput
): Promise<Paginated<E>> {
  let filterOp: FindOperator<unknown> = Not(IsNull());
  if (nextToken) {
    const tokenDeserialized = JSON.parse(nextToken) as unknown;
    filterOp =
      sortDirection === 'ASC'
        ? MoreThan(tokenDeserialized)
        : LessThan(tokenDeserialized);
  }

  const hasWhere = qb.expressionMap.wheres.length > 0;

  // Note clone doesn't actually seem to do anything, so it's important to do count before adding where clauses
  const count = await qb.clone().getCount();

  const results = await qb
    .clone()
    .orderBy(`${qb.alias}.${key}`, sortDirection)
    [hasWhere ? 'andWhere' : 'where']({
      [key]: filterOp,
    })
    .take(pageSize + 1)
    .getMany();

  const hasNextPage = results.length > pageSize;
  return {
    items: results.slice(0, pageSize),
    total: count,
    hasNextPage,
    nextToken: hasNextPage
      ? JSON.stringify(getKeyValue(results[pageSize - 1]))
      : undefined,
  };
}
