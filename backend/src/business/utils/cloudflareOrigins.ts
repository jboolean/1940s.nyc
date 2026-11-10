// Cloudflare's Bot Fight Mode blocks our own automated requests (headless
// Chrome, server-to-server calls) to our *.1940s.nyc domains, and can't be
// exempted via rules on our plan. This routes those requests directly to
// the real origin instead. The hostname -> origin map is in SSM
// (CLOUDFLARE_BYPASS_ORIGINS), not here, so it's not published in the repo.
function loadDirectOrigins(): Record<string, string> {
  const raw = process.env.CLOUDFLARE_BYPASS_ORIGINS;
  if (!raw) {
    return {};
  }
  return JSON.parse(raw) as Record<string, string>;
}

const DIRECT_ORIGINS = loadDirectOrigins();

// The photo and map CloudFront distributions reject requests that lack this
// header (except print files). Cloudflare adds it in front of those hosts;
// requests that bypass Cloudflare must add it themselves.
const ORIGIN_VERIFY_HEADER = 'X-Origin-Verify';
const ORIGIN_VERIFY_VALUE = process.env.CLOUDFLARE_ORIGIN_VERIFY;

// Headers to send with a request that was rerouted by bypassCloudflare.
export function getBypassHeaders(): Record<string, string> {
  return ORIGIN_VERIFY_VALUE
    ? { [ORIGIN_VERIFY_HEADER]: ORIGIN_VERIFY_VALUE }
    : {};
}

// Rewrites a URL to its direct origin if its host is in the map, otherwise
// returns it unchanged.
export function bypassCloudflare(url: string): string {
  const parsed = new URL(url);
  const direct = DIRECT_ORIGINS[parsed.hostname];
  if (!direct) {
    return url;
  }

  const directOrigin = new URL(direct);
  parsed.protocol = directOrigin.protocol;
  parsed.host = directOrigin.host;
  return parsed.toString();
}
