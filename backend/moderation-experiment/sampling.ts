import { createHash } from 'crypto';
import compact from 'lodash/compact';
import partition from 'lodash/partition';
import sampleSize from 'lodash/sampleSize';
import { In } from 'typeorm';
import createConnectionIfNotExists, {
  AppDataSource,
} from '../src/createConnection';
import Story from '../src/entities/Story';
import StoryState from '../src/enum/StoryState';
import { HumanLabel, SampledStory } from './types';

// Fixed so the holdout split is stable/reproducible across runs and across
// time (new stories fall deterministically into working or holdout based on
// id alone) without needing to persist any state.
const HOLDOUT_SALT = 'fourtiesnyc-moderation-holdout-v1';
const HOLDOUT_PERCENT = 20;

function isHoldout(storyId: number): boolean {
  const hash = createHash('sha256')
    .update(`${HOLDOUT_SALT}:${storyId}`)
    .digest();
  const bucket = hash.readUInt32BE(0) % 100;
  return bucket < HOLDOUT_PERCENT;
}

function toHumanLabel(state: StoryState): HumanLabel | null {
  if (state === StoryState.PUBLISHED) return 'approved';
  if (state === StoryState.REJECTED) return 'rejected';
  return null;
}

// "system" means an automated rejection (e.g. spam/bot filtering), not an
// actual human moderation decision -- including these would corrupt the
// ground truth this whole tool scores against. Checked in JS rather than
// added to the SQL WHERE clause: TypeORM's Not('system') becomes SQL
// `<> 'system'`, which under three-valued logic also silently drops NULL
// last_reviewer rows -- not what was asked for.
const AUTOMATED_REVIEWER = 'system';

function toSampledStory(story: Story): SampledStory | null {
  const humanLabel = toHumanLabel(story.state);
  if (!humanLabel || !story.textContent) return null;
  if (story.lastReviewer === AUTOMATED_REVIEWER) return null;

  return {
    id: story.id,
    humanLabel,
    reviewedAt: story.updatedAt.toISOString(),
    input: {
      title: story.title,
      storyType: story.storyType,
      storytellerName: story.storytellerName,
      storytellerSubtitle: story.storytellerSubtitle,
      textContent: story.textContent,
    },
  };
}

export interface EligiblePools {
  working: SampledStory[];
  holdout: SampledStory[];
}

/** Keeps only stories reviewed in the last `months` months, since moderation standards drift over time. */
export function filterRecent(
  pool: SampledStory[],
  months: number
): SampledStory[] {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return pool.filter((s) => new Date(s.reviewedAt) >= cutoff);
}

export async function loadEligiblePools(): Promise<EligiblePools> {
  await createConnectionIfNotExists();

  // Read-only: a plain `find` (SELECT), no writes anywhere in this tool.
  const stories = await AppDataSource.getRepository(Story).find({
    where: { state: In([StoryState.PUBLISHED, StoryState.REJECTED]) },
  });

  const eligible = compact(stories.map(toSampledStory));
  const [holdout, working] = partition(eligible, (s) => isHoldout(s.id));

  return { working, holdout };
}

/** Draws up to `perClass` approved and `perClass` rejected stories at random. */
export function drawSample(
  pool: SampledStory[],
  perClass: number
): SampledStory[] {
  const [approved, rejected] = partition(
    pool,
    (s) => s.humanLabel === 'approved'
  );
  const sample = [
    ...sampleSize(approved, perClass),
    ...sampleSize(rejected, perClass),
  ];
  return sampleSize(sample, sample.length);
}

/** Draws `total` stories at the pool's natural approve/reject ratio -- a cheap stand-in for `--full`. */
export function drawNaturalSample(
  pool: SampledStory[],
  total: number
): SampledStory[] {
  const [approved, rejected] = partition(
    pool,
    (s) => s.humanLabel === 'approved'
  );
  const approvedCount = Math.round((approved.length / pool.length) * total);
  const rejectedCount = total - approvedCount;
  const sample = [
    ...sampleSize(approved, approvedCount),
    ...sampleSize(rejected, rejectedCount),
  ];
  return sampleSize(sample, sample.length);
}
