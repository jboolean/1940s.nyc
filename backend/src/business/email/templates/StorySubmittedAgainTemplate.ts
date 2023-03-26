import EmailTemplate from '../EmailTemplate';
import EmailStreamType from './EmailStreamType';
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
  streamType = EmailStreamType.TRANSACTIONAL;
}

export default new StorySubmittedAgainTemplate();
