import corsOrigins from './corsOrigins';

function isAllowed(origin: string): boolean {
  return corsOrigins.some((allowed) =>
    typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
  );
}

describe('corsOrigins', () => {
  it.each([
    'https://1940s.nyc',
    'http://dev.1940s.nyc:8080',
    'https://deploy-preview-12--1940s-nyc.netlify.app',
    'https://main--1940s-nyc.netlify.app',
  ])('allows %s', (origin) => {
    expect(isAllowed(origin)).toBe(true);
  });

  it.each([
    'http://deploy-preview-12--1940s-nyc.netlify.app',
    'https://evil.com/--1940s-nyc.netlify.app',
    'https://evil.com?--1940s-nyc.netlify.app',
    'https://a.b--1940s-nyc.netlify.app',
    'https://--1940s-nyc.netlify.app.evil.com',
    'http://1940s.nyc',
  ])('rejects %s', (origin) => {
    expect(isAllowed(origin)).toBe(false);
  });
});
