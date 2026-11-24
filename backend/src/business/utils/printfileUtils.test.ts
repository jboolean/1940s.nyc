import { getPrintfileKey } from './printfileUtils';

it.each([
  ['abc', 'merch/printfiles-dev/3-abc.jpg'],
  [null, 'merch/printfiles-dev/3.jpg'],
])('keys an item with token %p at %s', (printfileToken, key) => {
  expect(getPrintfileKey({ id: 3, printfileToken }, 'jpg')).toBe(key);
});
