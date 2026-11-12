const COMMERCE = ['/api/v1/', '/api'] as const;

describe('whccApi', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('loads in production without a key and refuses a call when it is made', async () => {
    process.env.STAGE = 'production';
    delete process.env.WHCC_SK;
    const { getSubmission } = await import('./whccApi');
    await expect(getSubmission('s')).rejects.toThrow(
      'production base URL is not configured'
    );
  });

  it('follows action links only on the sandbox host and under the expected path', async () => {
    process.env.STAGE = 'staging';
    const { linkPath } = await import('./whccApi');
    expect(
      linkPath(
        'https://apis-stage.whcc.com/api/v1/commerce/configured-products?ids=a,b',
        ...COMMERCE
      )
    ).toBe('/v1/commerce/configured-products?ids=a,b');
    for (const link of [
      'https://evil.example/api/v1/x',
      'https://apis-stage.whcc.com/api//evil.com/x',
      'https://apis-stage.whcc.com/api/v1//evil.com/x',
      'https://apis-stage.whcc.com/elsewhere/v1/x',
      'https://apis-stage.whcc.com/api/v1\\\\evil.com/x',
    ]) {
      expect(() => linkPath(link, ...COMMERCE)).toThrow();
    }
  });
});
