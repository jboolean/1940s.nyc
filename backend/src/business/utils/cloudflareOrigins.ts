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
