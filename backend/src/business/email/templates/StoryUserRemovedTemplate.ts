import EmailTemplate from '../EmailTemplate';
import Senders from './Senders';
import {
  StoryEmailTemplateData,
  StoryEmailMetadata,
} from './StoryUserEmailTemplateData';

class StoryUserRemovedTemplate extends EmailTemplate<
  StoryEmailTemplateData,
  StoryEmailMetadata
> {
  alias = 'story-user-removed';
  from = Senders.PERSONAL;
}

export default new StoryUserRemovedTemplate();
