import express from 'express';
import serverlessHttp from 'serverless-http';

/**
 * Regression test for the incident where bumping express 4 -> 5 (which pulls
 * in body-parser 2.x) silently broke JSON body parsing for every write
 * endpoint in production. See PR reverting "chore(deps): bump qs and express
 * in /backend" (#1483).
 *
 * body-parser 2.x guards against re-parsing an already-consumed body with
 * `onFinished.isFinished(req)`. serverless-http's Request shim
 * (lib/request.js) fakes a socket with `readable: false` and sets
 * `complete: true` on every request it builds - which makes
 * `onFinished.isFinished(req)` return true unconditionally, before the body
 * is ever read. body-parser then skips parsing entirely and `req.body` is
 * left as the raw request Buffer, not the parsed object.
 *
 * body-parser 1.x doesn't have this problem: it guards re-parsing with its
 * own `req._body` flag instead of `onFinished`, so it's unaffected by
 * serverless-http's fake socket.
 *
 * This test exercises the real combination of `express` + `serverless-http`
 * as installed (not a reimplementation of either), driving a Lambda-shaped
 * API Gateway proxy event through `serverless-http` exactly like
 * `appHandler.ts` does in production. If a future dependency bump
 * reintroduces this incompatibility, this test fails.
 */
describe('serverless-http + express.json() body parsing', () => {
  it('parses a JSON request body into req.body', async () => {
    const app = express();
    app.use(express.json());
    app.post('/echo', (req, res) => {
      res.json({ received: req.body as unknown });
    });

    const handler = serverlessHttp(app);

    const body = JSON.stringify({ state: 'submitted_for_fulfillment' });
    const event = {
      httpMethod: 'POST',
      path: '/echo',
      headers: {
        'Content-Type': 'application/json',
      },
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      body,
      isBase64Encoded: false,
      requestContext: {
        requestId: 'test-request-id',
        identity: { sourceIp: '127.0.0.1' },
      },
    };
    const context = {};

    interface LambdaResult {
      statusCode: number;
      body: string;
    }
    const result = (await handler(event, context)) as unknown as LambdaResult;

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      received: { state: 'submitted_for_fulfillment' },
    });
  });
});
