import corsOrigins from './corsOrigins';

const isAllowed = (origin: string): boolean =>
  corsOrigins.some((allowed) =>
    typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
  );

describe('corsOrigins', () => {
  it.each(['https://1940s.nyc', 'https://main--1940s-nyc.netlify.app'])(
    'allows %s',
    (origin) => expect(isAllowed(origin)).toBe(true)
  );

  it.each([
    'http://main--1940s-nyc.netlify.app',
    'https://evil.com/--1940s-nyc.netlify.app',
    'https://--1940s-nyc.netlify.app.evil.com',
  ])('rejects %s', (origin) => expect(isAllowed(origin)).toBe(false));
});
