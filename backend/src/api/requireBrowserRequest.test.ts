import type { Request, Response } from 'express';
import { Forbidden } from 'http-errors';
import requireBrowserRequest from './requireBrowserRequest';

function run(path: string, headers: Record<string, string> = {}): unknown {
  const lowerHeaders = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
  );
  const req = {
    path,
    get: (name: string) => lowerHeaders[name.toLowerCase()],
  } as unknown as Request;
  const next = jest.fn<void, [unknown?]>();
  requireBrowserRequest(req, {} as Response, next);
  expect(next).toHaveBeenCalledTimes(1);
  return next.mock.calls[0][0];
}

describe('requireBrowserRequest', () => {
  it.each(['same-site', 'same-origin'])(
    'allows Sec-Fetch-Site %s',
    (fetchSite) => {
      expect(run('/photos', { 'Sec-Fetch-Site': fetchSite })).toBeUndefined();
    }
  );

  it.each([
    'https://1940s.nyc',
    'http://dev.1940s.nyc:8080',
    'http://localhost:8080',
    'https://deploy-preview-12--1940s-nyc.netlify.app',
  ])('allows Origin %s', (origin) => {
    expect(
      run('/photos', { Origin: origin, 'Sec-Fetch-Site': 'cross-site' })
    ).toBeUndefined();
  });

  it('rejects requests with neither header', () => {
    expect(run('/photos/outtake-summaries')).toBeInstanceOf(Forbidden);
  });

  it('rejects an unknown Origin', () => {
    expect(
      run('/photos', {
        Origin: 'https://scraper.example',
        'Sec-Fetch-Site': 'cross-site',
      })
    ).toBeInstanceOf(Forbidden);
  });

  it.each(['none', 'cross-site'])(
    'rejects Sec-Fetch-Site %s on a non-exempt route',
    (fetchSite) => {
      expect(
        run('/photos/abc/download', { 'Sec-Fetch-Site': fetchSite })
      ).toBeInstanceOf(Forbidden);
    }
  );

  it.each([
    '/stripe-webhooks',
    '/postmark-webhooks',
    '/printful-webhooks',
    '/prodigi-webhooks',
    '/whcc-webhooks',
    '/stripe-webhooks/',
  ])('exempts webhook route %s', (path) => {
    expect(run(path)).toBeUndefined();
  });

  it('exempts the magic link login opened from email', () => {
    expect(
      run('/authentication/login-with-magic-link', {
        'Sec-Fetch-Site': 'cross-site',
      })
    ).toBeUndefined();
  });

  it('does not exempt other authentication routes', () => {
    expect(run('/authentication/me')).toBeInstanceOf(Forbidden);
  });
});
