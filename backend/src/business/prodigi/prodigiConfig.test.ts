import {
  assertOrderCreationAllowed,
  prodigiEnvironmentFromBaseUrl,
} from './prodigiConfig';

describe('prodigiEnvironmentFromBaseUrl', () => {
  it.each([
    ['api.sandbox.prodigi.com', 'sandbox'],
    ['https://api.sandbox.prodigi.com/v4.0', 'sandbox'],
    ['api.prodigi.com', 'production'],
    [' https://api.prodigi.com ', 'production'],
  ])('%s -> %s', (url, env) => {
    expect(prodigiEnvironmentFromBaseUrl(url)).toBe(env);
  });

  it('rejects unknown hosts so a typo cannot be mistaken for the sandbox', () => {
    expect(() =>
      prodigiEnvironmentFromBaseUrl('api.sandbox.prodigi.com.evil.io')
    ).toThrow();
    expect(() => prodigiEnvironmentFromBaseUrl('example.com')).toThrow();
  });
});

describe('assertOrderCreationAllowed', () => {
  it('allows the sandbox', () => {
    expect(() =>
      assertOrderCreationAllowed('api.sandbox.prodigi.com', undefined)
    ).not.toThrow();
  });

  it('blocks the live API by default', () => {
    expect(() =>
      assertOrderCreationAllowed('api.prodigi.com', undefined)
    ).toThrow(/live API/);
    expect(() => assertOrderCreationAllowed('api.prodigi.com', '')).toThrow();
    expect(() =>
      assertOrderCreationAllowed('api.prodigi.com', 'false')
    ).toThrow();
    expect(() => assertOrderCreationAllowed('api.prodigi.com', '1')).toThrow();
  });

  it('allows the live API only with the explicit flag', () => {
    expect(() =>
      assertOrderCreationAllowed('api.prodigi.com', 'true')
    ).not.toThrow();
  });
});
