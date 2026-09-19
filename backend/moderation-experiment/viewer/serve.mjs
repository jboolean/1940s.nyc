// Zero-dependency static file server for viewing moderation experiment
// results locally, and for triggering runs from the browser. Binds to
// localhost only. Never publish this or its output anywhere else --
// results contain real story text (sometimes offensive/sexual content per
// the moderation rules being tested) and storyteller names. Triggering a
// run from here makes real, billed OpenRouter calls and reads production
// data, exactly like running `npm run experiment` yourself.
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXPERIMENT_DIR = path.join(__dirname, '..');
const RESULTS_DIR = path.join(EXPERIMENT_DIR, 'results');
const RUN_SH = path.join(EXPERIMENT_DIR, 'run.sh');
const PORT = process.env.PORT ? Number(process.env.PORT) : 4500;

const SAFE_FILENAME = /^[a-zA-Z0-9._-]+\.json$/;
const SAFE_MODEL = /^[a-zA-Z0-9._/:-]+$/;

// Only one run at a time -- this is a single-user local tool, and letting
// two runs share the same sample-cache file would be confusing at best.
let activeRun = null; // { id, logs: string[], exitCode: number|null, clients: Set<ServerResponse> }

function broadcast(run, event) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of run.clients) client.write(payload);
}

function startRun(options) {
  const args = [];
  if (options.newSample) args.push('--new-sample');
  if (options.holdout) args.push('--holdout');
  args.push('--sample-size', String(options.sampleSize));
  args.push('--concurrency', String(options.concurrency));
  args.push('--moderator', options.moderator);
  if (options.model) args.push('--model', options.model);

  const child = spawn('bash', [RUN_SH, ...args], { cwd: EXPERIMENT_DIR });

  const run = {
    id: randomUUID(),
    logs: [`$ run.sh ${args.join(' ')}`],
    exitCode: null,
    clients: new Set(),
  };

  const onOutput = (chunk) => {
    const text = chunk.toString();
    run.logs.push(text);
    broadcast(run, { type: 'output', text });
  };

  child.stdout.on('data', onOutput);
  child.stderr.on('data', onOutput);

  child.on('close', (code) => {
    run.exitCode = code;
    broadcast(run, { type: 'done', exitCode: code });
    for (const client of run.clients) client.end();
    run.clients.clear();
  });

  child.on('error', (err) => {
    run.exitCode = 1;
    broadcast(run, { type: 'done', exitCode: 1, error: String(err) });
    for (const client of run.clients) client.end();
    run.clients.clear();
  });

  activeRun = run;
  return run;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10_000) req.destroy(new Error('Request body too large'));
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function validateRunOptions(body) {
  const moderator = body.moderator === 'llm' ? 'llm' : 'jev';
  const sampleSize = Math.min(Math.max(Math.trunc(Number(body.sampleSize) || 20), 1), 200);
  const concurrency = Math.min(Math.max(Math.trunc(Number(body.concurrency) || 5), 1), 20);
  const newSample = Boolean(body.newSample);
  const holdout = Boolean(body.holdout);
  const model =
    typeof body.model === 'string' && SAFE_MODEL.test(body.model) ? body.model : undefined;

  return { moderator, sampleSize, concurrency, newSample, holdout, model };
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');

    if (url.pathname === '/' || url.pathname === '/index.html') {
      const html = await readFile(path.join(__dirname, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      return;
    }

    if (url.pathname === '/results') {
      const files = (await readdir(RESULTS_DIR).catch(() => []))
        .filter((f) => SAFE_FILENAME.test(f))
        .sort()
        .reverse();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(files));
      return;
    }

    if (url.pathname.startsWith('/results/')) {
      const filename = url.pathname.slice('/results/'.length);
      if (!SAFE_FILENAME.test(filename)) {
        res.writeHead(400);
        res.end('Invalid filename');
        return;
      }
      const data = await readFile(path.join(RESULTS_DIR, filename));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
      return;
    }

    if (url.pathname === '/run' && req.method === 'POST') {
      if (activeRun && activeRun.exitCode === null) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'A run is already in progress' }));
        return;
      }
      const body = await readJsonBody(req);
      const run = startRun(validateRunOptions(body));
      res.writeHead(202, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ runId: run.id }));
      return;
    }

    const streamMatch = /^\/run\/([^/]+)\/stream$/.exec(url.pathname);
    if (streamMatch && req.method === 'GET') {
      const [, runId] = streamMatch;
      if (!activeRun || activeRun.id !== runId) {
        res.writeHead(404);
        res.end('No such run');
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      // Replay everything buffered so far, then keep the connection open.
      for (const line of activeRun.logs) {
        res.write(`data: ${JSON.stringify({ type: 'output', text: line })}\n\n`);
      }
      if (activeRun.exitCode !== null) {
        res.write(
          `data: ${JSON.stringify({ type: 'done', exitCode: activeRun.exitCode })}\n\n`
        );
        res.end();
        return;
      }
      activeRun.clients.add(res);
      req.on('close', () => activeRun?.clients.delete(res));
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  } catch (e) {
    res.writeHead(500);
    res.end(String(e));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Moderation experiment viewer: http://localhost:${PORT}`);
  console.log('Local only -- do not expose this port or share its output.');
});
