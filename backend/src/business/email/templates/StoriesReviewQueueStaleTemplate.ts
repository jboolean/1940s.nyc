import EmailTemplate from '../EmailTemplate';
import EmailStreamType from './EmailStreamType';
import Senders from './Senders';

type StoryReviewEmailTemplateData = {
  storiesCount: number;
  reviewStoriesUrl: string;
  stats: { reviewer: string; count: number }[];
};

class StoriesReviewQueueStaleTemplate extends EmailTemplate<
  StoryReviewEmailTemplateData,
  Record<string, never>
> {
  alias = 'review-queue-stale';
  from = Senders.PERSONAL;
  streamType = EmailStreamType.TRANSACTIONAL;
}

export default new StoriesReviewQueueStaleTemplate();
