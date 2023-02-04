import Story from '../../entities/Story';
import StoryState from '../../enum/StoryState';
import StoryRepository from '../../repositories/StoryRepository';
import { sendSubmittedEmail } from './StoryUserEmailService';

async function onStorySubmitted(storyId: Story['id']): Promise<void> {
  const story = await StoryRepository().findOne({
    where: { id: storyId },
    relations: {
      photo: true,
    },
  });

  if (!story) {
    throw new Error('Story not found');
  }

  if (story.state !== StoryState.SUBMITTED) {
    throw new Error('Story must be submitted');
  }

  try {
    await sendSubmittedEmail(story);
  } catch (e) {
    console.error('Error sending story submitted email', e);
  }
}

export async function onStateTransition(
  storyId: Story['id'],
  priorState: StoryState,
  nextState: StoryState
): Promise<void> {
  if (priorState === StoryState.DRAFT && nextState === StoryState.SUBMITTED) {
    await onStorySubmitted(storyId);
  }
}
