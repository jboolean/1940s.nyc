import { NextFunction, Request, Response } from 'express';
import { Forbidden } from 'http-errors';

export const ALLOWED_ORIGINS: (string | RegExp)[] = [
  'http://dev.1940s.nyc:8080',
  'http://localhost:8080',
  'https://1940s.nyc',
  /--1940s-nyc\.netlify\.app$/,
];

// Called by vendors, or opened from a link in an email.
const EXEMPT_PATHS = [
  /^\/[a-z]+-webhooks(\/|$)/,
  /^\/authentication\/login-with-magic-link\/?$/,
];

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.some((allowed) =>
    typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
  );
}

export default function requireBrowserRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const fetchSite = req.get('sec-fetch-site');
  const origin = req.get('origin');
  if (
    fetchSite === 'same-site' ||
    fetchSite === 'same-origin' ||
    (origin && isAllowedOrigin(origin)) ||
    EXEMPT_PATHS.some((path) => path.test(req.path))
  ) {
    next();
    return;
  }
  next(new Forbidden());
}
