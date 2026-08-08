import type * as express from 'express';

/**
 * Requests reach us through Cloudflare -> API Gateway, so the socket address is a
 * Cloudflare edge IP and X-Forwarded-For has two proxy hops appended to it.
 * Cloudflare sets CF-Connecting-IP to the client address it saw, overwriting
 * anything the client sent, so it is more reliable than counting proxy hops.
 *
 * This makes `req.ip` return that address, so everything downstream — Sentry,
 * controllers, rate limiting — sees the real client without having to know about
 * Cloudflare. Requests that bypass Cloudflare fall back to the `trust proxy`
 * setting in app.ts.
 */
export default function cloudflareIp(): express.RequestHandler {
  return (req, res, next) => {
    const cfConnectingIp = req.header('CF-Connecting-IP');
    if (cfConnectingIp) {
      Object.defineProperty(req, 'ip', {
        configurable: true,
        enumerable: true,
        get: () => cfConnectingIp,
      });
    }
    next();
  };
}
