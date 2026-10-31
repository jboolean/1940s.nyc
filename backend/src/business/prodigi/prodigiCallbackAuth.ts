import crypto from 'crypto';
import required from '../utils/required';

// Prodigi callbacks are unsigned, so each order gets its own callback URL carrying a token only we can derive.
export function createCallbackToken(merchOrderId: number): string {
  return crypto
    .createHmac('sha256', required(process.env.JWT_SECRET, 'JWT_SECRET'))
    .update(`prodigi-callback:${merchOrderId}`)
    .digest('hex');
}

export function isValidCallbackToken(
  merchOrderId: number,
  token: string
): boolean {
  const expected = Buffer.from(createCallbackToken(merchOrderId));
  const actual = Buffer.from(token);
  return (
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual)
  );
}
