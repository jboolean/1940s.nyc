import last from 'lodash/last';
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
import required from '../business/utils/required';

export async function getPaginated<E extends ObjectLiteral>(
  qb: SelectQueryBuilder<E>,
  {
    key,
    sortDirection,
    getSerializedToken,
    deserializeToken,
  }: PaginationOptions<E>,
  { pageToken: nextToken, pageSize }: PaginationInput
): Promise<Paginated<E>> {
  let filterOp: FindOperator<unknown> = Not(IsNull());
  if (nextToken) {
    const tokenDeserialized = deserializeToken(nextToken);
    console.log('tokenDeserialized', nextToken, tokenDeserialized);
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

  const items = results.slice(0, pageSize);
  const hasNextPage = results.length > pageSize;
  const nextNextToken = hasNextPage
    ? getSerializedToken(required(last(items), 'last'))
    : undefined;
  return {
    items,
    total: count,
    hasNextPage,
    nextToken: nextNextToken,
  };
}
