import express from 'express';
import type { AddressInfo } from 'net';
import { createRequireCloudflare } from './requireCloudflare';

const SECRET = 'expected-secret';

async function request(
  enforce: boolean,
  path: string,
  header?: string
): Promise<{ status: number; body: unknown }> {
  const app = express();
  app.use(createRequireCloudflare({ enforce, expected: SECRET }));
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

it('lets a matching header through', async () => {
  expect((await request(true, '/photos', SECRET)).status).toBe(200);
});

it.each([
  ['wrong', 'wrong'],
  ['missing', undefined],
])('rejects a %s header when enforcing', async (_, header) => {
  expect((await request(true, '/photos', header)).status).toBe(403);
});

it('lets a mismatch through and reports it when not enforcing', async () => {
  expect((await request(false, '/photos', 'wrong')).status).toBe(200);
  expect(await request(false, '/__origin-check', 'wrong')).toEqual({
    status: 200,
    body: { originVerify: 'mismatch' },
  });
});
