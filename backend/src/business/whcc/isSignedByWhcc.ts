import { createHmac, timingSafeEqual } from 'crypto';
import required from '../utils/required';

const SIGNATURE_TOLERANCE_SECONDS = 300;

// The WHCC-Signature header is t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<raw body>">. During a
// secret rotation it carries two v1 values and either may match.
export function isSignedByWhcc(
  header: string | undefined,
  rawBody: Buffer
): boolean {
  const elements = (header ?? '').split(',').map((part) => {
    const at = part.indexOf('=');
    return [part.slice(0, at), part.slice(at + 1)] as const;
  });
  const timestamp = elements.find(([k]) => k === 't')?.[1];
  const signatures = elements.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (
    !timestamp ||
    !/^\d+$/.test(timestamp) ||
    Math.abs(Date.now() / 1000 - Number(timestamp)) >
      SIGNATURE_TOLERANCE_SECONDS
  ) {
    return false;
  }
  const expected = createHmac(
    'sha256',
    required(process.env.WHCC_SIGNING_SECRET, 'WHCC_SIGNING_SECRET')
  )
    .update(`${timestamp}.`)
    .update(rawBody)
    .digest();
  return signatures.some((signature) => {
    const actual = Buffer.from(signature, 'hex');
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  });
}
