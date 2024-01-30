import map from 'lodash/map';
import Paginated from '../pagination/Paginated';

export default function mapPaginated<I, O>(
  paginated: Paginated<I>,
  fn: (I) => O
): Paginated<O> {
  return {
    ...paginated,
    items: map<I, O>(paginated.items, fn),
  };
}
