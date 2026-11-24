import type { Request, Response } from 'express';
import { Forbidden } from 'http-errors';
import requireBrowserRequest from './requireBrowserRequest';

function run(path: string, headers: Record<string, string>): unknown {
  const req = {
    path,
    get: (name: string) => headers[name.toLowerCase()],
  } as unknown as Request;
  const next = jest.fn<void, [unknown?]>();
  requireBrowserRequest(req, {} as Response, next);
  return next.mock.calls[0][0];
}

describe('requireBrowserRequest', () => {
  it.each<[string, Record<string, string>]>([
    ['/photos', { 'sec-fetch-site': 'same-site' }],
    ['/photos', { origin: 'https://1940s.nyc' }],
    ['/stripe-webhooks', {}],
  ])('allows %s with %o', (path, headers) => {
    expect(run(path, headers)).toBeUndefined();
  });

  it.each<Record<string, string>>([
    {},
    { origin: 'https://scraper.example' },
    { 'sec-fetch-site': 'none' },
  ])('rejects %o', (headers) => {
    expect(run('/photos', headers)).toBeInstanceOf(Forbidden);
  });
});
