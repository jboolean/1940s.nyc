import Story from '../../entities/Story';
import StoryState from '../../enum/StoryState';
import StoryRepository from '../../repositories/StoryRepository';
import {
  sendPublishedEmail,
  sendSubmittedEmail,
} from './StoryUserEmailService';

function getStoryOrThrow(storyId: Story['id']): Promise<Story> {
  return StoryRepository().findOneOrFail({
    where: { id: storyId },
    relations: { photo: true },
  });
}

async function onStorySubmitted(storyId: Story['id']): Promise<void> {
  const story = await getStoryOrThrow(storyId);

  if (story.state !== StoryState.SUBMITTED) {
    throw new Error('Story must be submitted');
  }

  try {
    await sendSubmittedEmail(story);
  } catch (e) {
    console.error('Error sending story submitted email', e);
  }
}

async function onStoryPublished(storyId: Story['id']): Promise<void> {
  const story = await getStoryOrThrow(storyId);

  if (story.state !== StoryState.PUBLISHED) {
    throw new Error('Story must be submitted');
  }

  try {
    await sendPublishedEmail(story);
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
  if (
    priorState === StoryState.SUBMITTED &&
    nextState === StoryState.PUBLISHED
  ) {
    await onStoryPublished(storyId);
  }
}
