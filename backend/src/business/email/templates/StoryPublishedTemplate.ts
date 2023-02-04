import EmailTemplate from '../EmailTemplate';
import Senders from './Senders';
import {
  StoryEmailTemplateData,
  StoryEmailMetadata,
} from './StoryUserEmailTemplateData';

class StoryPublishedTemplate extends EmailTemplate<
  StoryEmailTemplateData,
  StoryEmailMetadata
> {
  alias = 'story-published';
  from = Senders.PERSONAL;
}

export default new StoryPublishedTemplate();
