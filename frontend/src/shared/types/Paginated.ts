interface Paginated<T> {
  items: T[];
  total: number;
  hasNextPage: boolean;
  nextToken?: string;
}

export default Paginated;
