import { ObjectLiteral } from 'typeorm';

interface PaginationOptions<E extends ObjectLiteral> {
  key: string;
  sortDirection?: 'ASC' | 'DESC';
  getSerializedToken: (entity: E) => string;
  deserializeToken: (token: string) => unknown;
}

export default PaginationOptions;
