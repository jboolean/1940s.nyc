import EmailTemplate from '../EmailTemplate';
import Senders from './Senders';

export interface StorySubmittedData {
  storytellerName: string;
  photoDescription: string;
  storyEditUrl: string;
}

export interface StorySubmittedEmailMetadata {
  storyId: string;
}

class StorySubmittedTemplate extends EmailTemplate<
  StorySubmittedData,
  StorySubmittedEmailMetadata
> {
  alias = 'story-submitted';
  from = Senders.PERSONAL;
}

export default new StorySubmittedTemplate();
