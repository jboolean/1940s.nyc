import { timingSafeEqual } from 'crypto';
import { RequestHandler } from 'express';

// Cloudflare adds X-Origin-Verify via its origin-verify Transform Rule, so a
// request without it reached the API some other way (for example the API
// Gateway's own CloudFront domain) and its X-Forwarded-For can't be trusted.
// /__origin-check reports whether the header arrived, without revealing its value.
const ENFORCE = false;

type OriginVerifyResult = 'match' | 'mismatch' | 'missing';

function checkOriginVerify(
  received: string | undefined,
  expected: string
): OriginVerifyResult {
  if (!received) {
    return 'missing';
  }
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? 'match' : 'mismatch';
}

export function createRequireCloudflare({
  enforce,
  expected,
}: {
  enforce: boolean;
  expected: string | undefined;
}): RequestHandler {
  return (req, res, next) => {
    if (!expected) {
      next();
      return;
    }
    const result = checkOriginVerify(req.get('x-origin-verify'), expected);
    if (req.method === 'GET' && req.path === '/__origin-check') {
      res.set('Cache-Control', 'no-store').json({ originVerify: result });
      return;
    }
    if (enforce && result !== 'match') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}

export default createRequireCloudflare({
  enforce: ENFORCE,
  expected: process.env.CLOUDFLARE_ORIGIN_VERIFY,
});
