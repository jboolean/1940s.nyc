import StoryState from '../enum/StoryState';
import StoryRepository from '../repositories/StoryRepository';
import EmailService from '../business/email/EmailService';
import ReviewQueueStaleTemplate from '../business/email/templates/ReviewQueueStaleTemplate';

const STALENESS_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 2;

function forgeReviewStoriesUrl(): string {
  const storyEditUrl: URL = new URL(
    `/admin/review-stories`,
    process.env.FRONTEND_BASE_URL
  );

  return storyEditUrl.toString();
}

export default async function checkStaleStories(): Promise<void> {
  const hasStaleStories =
    (await StoryRepository()
      .createQueryBuilder('story')
      .where({ state: StoryState.SUBMITTED })
      .andWhere('story.updated_at < :stalenessThreshold', {
        stalenessThreshold: new Date(Date.now() - STALENESS_THRESHOLD_MS),
      })
      .orderBy('story.updated_at', 'ASC')
      .getCount()) > 0;

  if (!hasStaleStories) {
    console.log('No stale stories found');
    return;
  }

  const storiesCount = (await StoryRepository().findForReview()).length;

  const reviewStoriesUrl = forgeReviewStoriesUrl();

  const email = ReviewQueueStaleTemplate.createTemplatedEmail({
    templateContext: {
      reviewStoriesUrl,
      storiesCount,
    },
    metadata: {},
    to: process.env.MODERATORS_TO_EMAIL ?? '',
  });

  await EmailService.sendTemplateEmail(email);
}
