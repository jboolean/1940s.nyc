import express from 'express';
import type { AddressInfo } from 'net';
import { createRequireCloudflare } from './requireCloudflare';

const SECRET = 'expected-secret';

async function request(
  options: { enforce: boolean; expected: string | undefined },
  path: string,
  header?: string
): Promise<{ status: number; body: unknown }> {
  const app = express();
  app.use(createRequireCloudflare(options));
  app.get('*', (req, res) => {
    res.json({ ok: true });
  });
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      headers: header === undefined ? {} : { 'X-Origin-Verify': header },
    });
    return { status: res.status, body: await res.json() };
  } finally {
    server.close();
  }
}

describe('/__origin-check', () => {
  const options = { enforce: true, expected: SECRET };

  it('reports match', async () => {
    expect(await request(options, '/__origin-check', SECRET)).toEqual({
      status: 200,
      body: { originVerify: 'match' },
    });
  });

  it('reports mismatch, including a different length', async () => {
    for (const header of ['expected-secreT', 'short']) {
      expect(await request(options, '/__origin-check', header)).toEqual({
        status: 200,
        body: { originVerify: 'mismatch' },
      });
    }
  });

  it('reports missing', async () => {
    expect(await request(options, '/__origin-check')).toEqual({
      status: 200,
      body: { originVerify: 'missing' },
    });
  });
});

describe('when enforcing', () => {
  const options = { enforce: true, expected: SECRET };

  it('lets a matching request through', async () => {
    expect((await request(options, '/photos', SECRET)).status).toBe(200);
  });

  it('rejects a mismatched header', async () => {
    expect((await request(options, '/photos', 'wrong')).status).toBe(403);
  });

  it('rejects a missing header', async () => {
    expect((await request(options, '/photos')).status).toBe(403);
  });
});

describe('when not enforcing', () => {
  const options = { enforce: false, expected: SECRET };

  it('lets mismatched and missing requests through', async () => {
    expect((await request(options, '/photos', 'wrong')).status).toBe(200);
    expect((await request(options, '/photos')).status).toBe(200);
  });
});

describe('when the secret is not configured', () => {
  const options = { enforce: true, expected: undefined };

  it('lets every request through', async () => {
    expect((await request(options, '/photos')).status).toBe(200);
  });

  it('does not answer /__origin-check', async () => {
    expect(await request(options, '/__origin-check')).toEqual({
      status: 200,
      body: { ok: true },
    });
  });
});
