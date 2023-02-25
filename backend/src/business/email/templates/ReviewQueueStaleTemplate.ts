import EmailTemplate from '../EmailTemplate';
import Senders from './Senders';

type StoryEmailTemplateData = {
  storiesCount: number;
  reviewStoriesUrl: string;
};

class ReviewQueueStaleTemplate extends EmailTemplate<
  StoryEmailTemplateData,
  Record<string, never>
> {
  alias = 'review-queue-stale';
  from = Senders.PERSONAL;
}

export default new ReviewQueueStaleTemplate();
