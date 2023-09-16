import EmailTemplate from '../EmailTemplate';
import EmailStreamType from './EmailStreamType';
import Senders from './Senders';

type StoryEmailTemplateData = {
  storiesCount: number;
  reviewStoriesUrl: string;
  stats: { reviewer: string; count: number }[];
};

class ReviewQueueStaleTemplate extends EmailTemplate<
  StoryEmailTemplateData,
  Record<string, never>
> {
  alias = 'review-queue-stale';
  from = Senders.PERSONAL;
  streamType = EmailStreamType.TRANSACTIONAL;
}

export default new ReviewQueueStaleTemplate();
