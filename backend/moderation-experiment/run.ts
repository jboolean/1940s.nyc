import 'reflect-metadata';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import { Command, Option } from 'commander';
import { AppDataSource } from '../src/createConnection';
import createJevModerator from './moderators/jevModerator';
import createLlmModerator from './moderators/llmModerator';
import {
  drawNaturalSample,
  drawSample,
  filterRecent,
  loadEligiblePools,
} from './sampling';
import { Moderator, RuleKey, SampledStory } from './types';

// Time from process start until this module's imports finish loading.
const STARTUP_MS = Math.round(performance.now());

// run.sh runs this from backend/; __dirname would point into .build/.
const EXPERIMENT_DIR = path.join(process.cwd(), 'moderation-experiment');
const CACHE_DIR = path.join(EXPERIMENT_DIR, '.cache');
const RESULTS_DIR = path.join(EXPERIMENT_DIR, 'results');
const SAMPLE_CACHE_PATH = path.join(CACHE_DIR, 'current-sample.json');
const HOLDOUT_LOG_PATH = path.join(CACHE_DIR, 'holdout-run-log.json');

interface Args {
  newSample: boolean;
  sampleSize: number;
  holdout: boolean;
  full: boolean;
  natural: boolean;
  recentMonths?: number;
  moderator: 'jev' | 'llm';
  model?: string;
  concurrency: number;
}

function parseArgs(argv: string[]): Args {
  const program = new Command()
    .name('experiment')
    .description(
      'Score a sample of real stories with an AI moderator and compare to what a human decided.'
    )
    .option(
      '--new-sample',
      'draw a fresh random working sample instead of reusing the cached one',
      false
    )
    .addOption(
      new Option(
        '--sample-size <n>',
        'stories per class (approved/rejected) to sample'
      )
        .argParser(Number)
        .default(20)
    )
    .option(
      '--holdout',
      'evaluate the untouched holdout set -- only once you believe the prompt is done',
      false
    )
    .option(
      '--full',
      "evaluate the entire pool (working or, with --holdout, holdout) instead of a --sample-size-bounded sample. For the working pool this also uses the natural (unbalanced) class mix instead of drawSample's balanced perClass draw.",
      false
    )
    .option(
      '--natural',
      "working pool only: draw --sample-size TOTAL stories at the pool's natural (unbalanced) approve/reject ratio instead of a balanced perClass draw -- a cheap stand-in for --full that still reflects real-world-weighted accuracy without scoring the whole pool",
      false
    )
    .addOption(
      new Option(
        '--recent-months <n>',
        'restrict the pool to stories reviewed in the last N months before sampling/drawing -- moderation standards drift over time, so this reflects current policy instead of a blend of old and new standards'
      ).argParser(Number)
    )
    .addOption(
      new Option('--moderator <name>', 'which backend to score with')
        .choices(['jev', 'llm'])
        .default('jev')
    )
    .option(
      '--model <id>',
      'override the default model for the chosen moderator'
    )
    .addOption(
      new Option('--concurrency <n>', 'concurrent API calls')
        .argParser(Number)
        .default(5)
    )
    .parse(argv, { from: 'user' });

  const opts = program.opts();

  return {
    newSample: Boolean(opts.newSample),
    sampleSize: Number(opts.sampleSize),
    holdout: Boolean(opts.holdout),
    full: Boolean(opts.full),
    natural: Boolean(opts.natural),
    recentMonths:
      typeof opts.recentMonths === 'number' ? opts.recentMonths : undefined,
    moderator: opts.moderator === 'llm' ? 'llm' : 'jev',
    model: typeof opts.model === 'string' ? opts.model : undefined,
    concurrency: Number(opts.concurrency),
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array<R>(items.length);
  let next = 0;

  async function worker(): Promise<void> {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker)
  );

  return results;
}

interface ScoredStory {
  id: number;
  humanLabel: 'approved' | 'rejected';
  reviewedAt: string;
  // Omitted for holdout runs so the holdout content is never read.
  title?: string | null;
  textContent?: string;
  modelLabel?: 'approved' | 'rejected';
  approveProbability?: number;
  ruleProbabilities?: Record<RuleKey, number>;
  costUsd?: number | null;
  correct?: boolean;
  error?: string;
}

async function score(
  moderator: Moderator,
  sample: SampledStory[],
  concurrency: number,
  redactContent: boolean
): Promise<ScoredStory[]> {
  return mapWithConcurrency(sample, concurrency, async (story) => {
    const base: ScoredStory = {
      id: story.id,
      humanLabel: story.humanLabel,
      reviewedAt: story.reviewedAt,
      ...(redactContent
        ? {}
        : { title: story.input.title, textContent: story.input.textContent }),
    };

    try {
      const verdict = await moderator.classify(story.input);
      const modelLabel: 'approved' | 'rejected' = verdict.approve
        ? 'approved'
        : 'rejected';
      return {
        ...base,
        modelLabel,
        approveProbability: verdict.approveProbability,
        ruleProbabilities: verdict.ruleProbabilities,
        costUsd: verdict.costUsd,
        correct: modelLabel === story.humanLabel,
      };
    } catch (e) {
      return { ...base, error: e instanceof Error ? e.message : String(e) };
    }
  });
}

interface HoldoutLogEntry {
  timestamp: string;
  moderator: string;
  model: string;
  summary: Summary;
}

interface Summary {
  total: number;
  errors: number;
  scored: number;
  correct: number;
  accuracy: number;
  totalApproved: number;
  totalRejected: number;
  falseApprove: number; // human rejected, model approved -- the dangerous error
  falseApproveRate: number;
  falseReject: number; // human approved, model rejected -- safe but costs automation
  falseRejectRate: number;
  totalCostUsd: number | null; // null if the API never returned cost data
  avgCostUsd: number | null;
}

function summarize(scored: ScoredStory[]): Summary {
  const valid = scored.filter((s) => !s.error);
  const errors = scored.length - valid.length;
  const correct = valid.filter((s) => s.correct).length;

  const totalApproved = valid.filter((s) => s.humanLabel === 'approved').length;
  const totalRejected = valid.filter((s) => s.humanLabel === 'rejected').length;

  const falseApprove = valid.filter(
    (s) => s.humanLabel === 'rejected' && s.modelLabel === 'approved'
  ).length;
  const falseReject = valid.filter(
    (s) => s.humanLabel === 'approved' && s.modelLabel === 'rejected'
  ).length;

  const costs = valid
    .map((s) => s.costUsd)
    .filter((c): c is number => typeof c === 'number');
  const totalCostUsd = costs.length
    ? costs.reduce((sum, c) => sum + c, 0)
    : null;
  const avgCostUsd = totalCostUsd !== null ? totalCostUsd / costs.length : null;

  return {
    total: scored.length,
    errors,
    scored: valid.length,
    correct,
    accuracy: valid.length ? correct / valid.length : 0,
    totalApproved,
    totalRejected,
    falseApprove,
    falseApproveRate: totalRejected ? falseApprove / totalRejected : 0,
    falseReject,
    falseRejectRate: totalApproved ? falseReject / totalApproved : 0,
    totalCostUsd,
    avgCostUsd,
  };
}

function formatCostUsd(cost: number): string {
  return `$${cost.toFixed(cost < 0.01 ? 6 : 2)}`;
}

// The highest-scoring rule is the one that decided the outcome.
function topRule(ruleProbabilities?: Record<RuleKey, number>): string {
  if (!ruleProbabilities) return '—';
  const entries = Object.entries(ruleProbabilities) as [RuleKey, number][];
  const [rule, prob] = entries.reduce((best, cur) =>
    cur[1] > best[1] ? cur : best
  );
  return `${rule} (${prob.toFixed(2)})`;
}

function printTimings(timings: {
  startup: number;
  loadPools: number;
  scoring: number;
}): void {
  console.log('\n=== Timing (ms) ===');
  console.table([
    {
      'node startup': timings.startup,
      'load stories from DB': timings.loadPools,
      'score via API': timings.scoring,
    },
  ]);
  console.log(
    'Not shown: run.sh resolving SSM credentials (~2-3s) and the incremental ' +
      'tsc build (a few seconds if rules.ts or another source file changed ' +
      'since the last run, near-instant if nothing did) -- both happen ' +
      'before this process starts.'
  );
}

function printReport(scored: ScoredStory[], summary: Summary): void {
  console.log('\n=== Mismatches ===');
  const mismatches = scored.filter((s) => !s.error && !s.correct);
  if (mismatches.length === 0) {
    console.log('(none)');
  } else {
    console.table(
      mismatches.map((s) => ({
        id: s.id,
        human: s.humanLabel,
        model: s.modelLabel,
        approveProb: s.approveProbability?.toFixed(2),
        topRule: topRule(s.ruleProbabilities),
        title:
          s.textContent !== undefined
            ? (s.title ?? s.textContent.slice(0, 40)).slice(0, 40)
            : '(redacted — holdout)',
      }))
    );
  }

  const erroredStories = scored.filter((s) => s.error);
  if (erroredStories.length > 0) {
    console.log('\n=== Errors ===');
    console.table(erroredStories.map((s) => ({ id: s.id, error: s.error })));
  }

  console.log('\n=== Summary ===');
  console.table([
    {
      total: summary.total,
      scored: summary.scored,
      errors: summary.errors,
      accuracy: `${(summary.accuracy * 100).toFixed(1)}%`,
      falseApprove: `${summary.falseApprove}/${summary.totalRejected} (${(
        summary.falseApproveRate * 100
      ).toFixed(1)}%)`,
      falseReject: `${summary.falseReject}/${summary.totalApproved} (${(
        summary.falseRejectRate * 100
      ).toFixed(1)}%)`,
      totalCost:
        summary.totalCostUsd !== null
          ? formatCostUsd(summary.totalCostUsd)
          : 'n/a',
      avgCostPerStory:
        summary.avgCostUsd !== null ? formatCostUsd(summary.avgCostUsd) : 'n/a',
    },
  ]);

  if (summary.falseApprove > 0) {
    console.log(
      `\n⚠️  ${summary.falseApprove} stor${
        summary.falseApprove === 1 ? 'y' : 'ies'
      } that a human rejected would have been auto-approved. Check the "Mismatches" table above.`
    );
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  mkdirSync(CACHE_DIR, { recursive: true });
  mkdirSync(RESULTS_DIR, { recursive: true });

  const moderator =
    args.moderator === 'jev'
      ? createJevModerator(args.model)
      : createLlmModerator(args.model);

  console.log(`Moderator: ${moderator.name} (${moderator.model})`);

  const poolsStart = performance.now();
  let pools = await loadEligiblePools();
  const loadPoolsMs = Math.round(performance.now() - poolsStart);
  console.log(
    `Eligible pool: ${pools.working.length} working, ${pools.holdout.length} holdout`
  );

  if (args.recentMonths !== undefined) {
    pools = {
      working: filterRecent(pools.working, args.recentMonths),
      holdout: filterRecent(pools.holdout, args.recentMonths),
    };
    console.log(
      `Restricted to stories reviewed in the last ${args.recentMonths} months: ${pools.working.length} working, ${pools.holdout.length} holdout`
    );
  }

  let sample: SampledStory[];
  let label: 'working' | 'holdout';

  if (args.holdout) {
    label = 'holdout';
    sample = args.full
      ? pools.holdout
      : drawSample(pools.holdout, args.sampleSize);
    console.log(
      '\n🔒 HOLDOUT RUN — this evaluates the untouched holdout set. Do not use these ' +
        'results to keep tuning rules.ts; that defeats the point of a holdout. Only ' +
        'use this to sanity-check a prompt you already believe is done.\n'
    );
    console.log(
      args.full
        ? `Evaluating the FULL holdout pool (${sample.length} stories).`
        : `Evaluating a sample of the holdout pool (${sample.length} of ${pools.holdout.length} stories). Pass --full for the entire pool.`
    );
  } else {
    label = 'working';
    if (args.full) {
      sample = pools.working;
      console.log(
        `Evaluating the FULL working pool (${sample.length} stories, natural class balance).`
      );
    } else if (args.natural) {
      sample = drawNaturalSample(pools.working, args.sampleSize);
      console.log(
        `Drew a natural-ratio sample (${sample.length} stories, real-world approve/reject mix).`
      );
    } else if (!args.newSample && existsSync(SAMPLE_CACHE_PATH)) {
      sample = JSON.parse(
        readFileSync(SAMPLE_CACHE_PATH, 'utf-8')
      ) as SampledStory[];
      console.log(`Reusing cached sample (${sample.length} stories).`);
    } else {
      sample = drawSample(pools.working, args.sampleSize);
      writeFileSync(SAMPLE_CACHE_PATH, JSON.stringify(sample, null, 2));
      console.log(`Drew new sample (${sample.length} stories).`);
    }
  }

  const scoreStart = performance.now();
  const scored = await score(
    moderator,
    sample,
    args.concurrency,
    label === 'holdout'
  );
  const scoreMs = Math.round(performance.now() - scoreStart);
  const summary = summarize(scored);

  printReport(scored, summary);
  printTimings({
    startup: STARTUP_MS,
    loadPools: loadPoolsMs,
    scoring: scoreMs,
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runRecord = {
    timestamp,
    label,
    moderator: moderator.name,
    model: moderator.model,
    summary,
    stories: scored,
  };

  writeFileSync(
    path.join(RESULTS_DIR, `${label}-latest.json`),
    JSON.stringify(runRecord, null, 2)
  );
  writeFileSync(
    path.join(RESULTS_DIR, `${label}-${timestamp}.json`),
    JSON.stringify(runRecord, null, 2)
  );

  if (label === 'holdout') {
    const log: HoldoutLogEntry[] = existsSync(HOLDOUT_LOG_PATH)
      ? (JSON.parse(
          readFileSync(HOLDOUT_LOG_PATH, 'utf-8')
        ) as HoldoutLogEntry[])
      : [];
    log.push({
      timestamp,
      moderator: moderator.name,
      model: moderator.model,
      summary,
    });
    writeFileSync(HOLDOUT_LOG_PATH, JSON.stringify(log, null, 2));
    console.log(
      `\nThis is holdout evaluation #${log.length}. If this number is climbing, you're at risk of tuning against the holdout by feel.`
    );
  }

  console.log(
    `\nRESULT_JSON: ${JSON.stringify({
      label,
      moderator: moderator.name,
      model: moderator.model,
      ...summary,
    })}`
  );
}

// The pg pool's open sockets otherwise keep the process alive.
async function closeDb(): Promise<void> {
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(closeDb);
