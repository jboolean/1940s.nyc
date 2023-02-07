import EmailTemplate from '../EmailTemplate';
import Senders from './Senders';
import {
  StoryEmailTemplateData,
  StoryEmailMetadata,
} from './StoryUserEmailTemplateData';

class StorySubmittedTemplate extends EmailTemplate<
  StoryEmailTemplateData,
  StoryEmailMetadata
> {
  alias = 'story-submitted';
  from = Senders.PERSONAL;
}

export default new StorySubmittedTemplate();