import memoize from 'lodash/memoize';

// https://stackoverflow.com/a/27232658
export default memoize(function canUseWebP(): boolean {
  const elem = document.createElement('canvas');

  if (elem.getContext && elem.getContext('2d')) {
    // was able or not to get WebP representation
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // very old browser like IE 8, canvas not supported
  return false;
});
