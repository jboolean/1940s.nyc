import EmailTemplate from '../EmailTemplate';
import Senders from './Senders';
import {
  StoryEmailTemplateData,
  StoryEmailMetadata,
} from './StoryUserEmailTemplateData';

class StorySubmittedAgainTemplate extends EmailTemplate<
  StoryEmailTemplateData,
  StoryEmailMetadata
> {
  alias = 'story-submitted-again';
  from = Senders.PERSONAL;
}

export default new StorySubmittedAgainTemplate();
