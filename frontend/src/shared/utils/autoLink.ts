import { defaultUrlTransform } from 'react-markdown';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

/**
 * Automatically transform any URLs in the given text into markdown links
 */
const autoLink = (text: string): string => {
  return text.replace(URL_REGEX, (url: string) => {
    // make sure we don't accidentally include any trailing punctuation in the link
    const trailingPunctuation = url.match(/[.,!?;:]+$/);
    const suffix = trailingPunctuation ? trailingPunctuation[0] : '';

    const urlWithoutPunctuation = trailingPunctuation
      ? url.slice(0, -suffix.length)
      : url;

    const cleanUrl = defaultUrlTransform(urlWithoutPunctuation);

    return `[${cleanUrl}](${cleanUrl})${suffix}`;
  });
};

export default autoLink;
