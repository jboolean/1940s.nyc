import { ObjectLiteral } from 'typeorm';

interface PaginationOptions<E extends ObjectLiteral> {
  key: string;
  sortDirection?: 'ASC' | 'DESC';
  getKeyValue: (entity: E) => unknown;
}

export default PaginationOptions;
