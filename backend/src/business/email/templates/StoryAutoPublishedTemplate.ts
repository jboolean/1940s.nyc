import EmailTemplate from '../EmailTemplate';
import EmailStreamType from './EmailStreamType';
import Senders from './Senders';
import {
  StoryEmailTemplateData,
  StoryEmailMetadata,
} from './StoryUserEmailTemplateData';

class StoryAutoPublishedTemplate extends EmailTemplate<
  StoryEmailTemplateData,
  StoryEmailMetadata
> {
  alias = 'story-auto-published';
  from = Senders.PERSONAL;
  streamType = EmailStreamType.TRANSACTIONAL;
}

export default new StoryAutoPublishedTemplate();
