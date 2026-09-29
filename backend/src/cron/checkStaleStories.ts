import EmailService from '../business/email/EmailService';
import ReviewQueueStaleTemplate from '../business/email/templates/StoriesReviewQueueStaleTemplate';
import StoryState from '../enum/StoryState';
import StoryRepository from '../repositories/StoryRepository';

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

// Stories should be reviewed within two days of submission.
const SLO_THRESHOLD_MS = ONE_DAY_MS * 2;

// Warn a day before the SLO is missed so moderators have time to act.
const WARNING_THRESHOLD_MS = SLO_THRESHOLD_MS - ONE_DAY_MS;

function forgeReviewStoriesUrl(): string {
  const storyEditUrl: URL = new URL(
    `/admin/review-stories`,
    process.env.FRONTEND_BASE_URL
  );

  return storyEditUrl.toString();
}

async function getReviewerStats(): Promise<
  { reviewer: string; count: number }[]
> {
  const stats: { reviewer: string; count: number }[] =
    await StoryRepository().query(
      `select last_reviewer as reviewer, count(*) as count from stories where last_reviewer is not null group by last_reviewer order by count(*) desc;`
    );
  return stats;
}

// How long the story at the head of the review queue has been waiting, or 0
// when the queue is empty.
async function getLongestWaitMs(): Promise<number> {
  const oldestStory = await StoryRepository()
    .createQueryBuilder('story')
    .where({ state: StoryState.SUBMITTED })
    .orderBy('story.updated_at', 'ASC')
    .getOne();

  return oldestStory ? Date.now() - oldestStory.updatedAt.getTime() : 0;
}

export default async function checkStaleStories(): Promise<void> {
  const longestWaitMs = await getLongestWaitMs();

  if (longestWaitMs < WARNING_THRESHOLD_MS) {
    console.log('No stories approaching the review SLO');
    return;
  }

  const storiesCount = (await StoryRepository().findForReview()).length;

  const reviewStoriesUrl = forgeReviewStoriesUrl();

  const stats = await getReviewerStats();

  const email = ReviewQueueStaleTemplate.createTemplatedEmail({
    templateContext: {
      reviewStoriesUrl,
      storiesCount,
      stats,
      isApproachingSlo: longestWaitMs < SLO_THRESHOLD_MS,
    },
    metadata: {},
    to: process.env.MODERATORS_TO_EMAIL ?? '',
  });

  await EmailService.sendTemplateEmail(email);
}
