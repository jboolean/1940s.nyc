import Story from '../../entities/Story';
import StoryState from '../../enum/StoryState';
import StoryRepository from '../../repositories/StoryRepository';
import {
  sendPublishedEmail,
  sendSubmittedAgainEmail,
  sendSubmittedEmail,
  sendUserRemovedEmail,
} from './StoryUserEmailService';

function getStoryOrThrow(
  storyId: Story['id'],
  state: StoryState
): Promise<Story> {
  return StoryRepository().findOneOrFail({
    where: { id: storyId, state },
    relations: { photo: true },
  });
}

async function onStorySubmitted(storyId: Story['id']): Promise<void> {
  const story = await getStoryOrThrow(storyId, StoryState.SUBMITTED);

  const hasSubmittedBefore = story.hasEverSubmitted;

  try {
    if (hasSubmittedBefore) {
      await sendSubmittedAgainEmail(story);
      return;
    }
    await sendSubmittedEmail(story);
  } catch (e) {
    console.error('Error sending story submitted email', e);
  }

  await StoryRepository().update(story.id, {
    hasEverSubmitted: true,
  });
}

async function onStoryPublished(storyId: Story['id']): Promise<void> {
  const story = await getStoryOrThrow(storyId, StoryState.PUBLISHED);

  try {
    // If we did not send submitted email before, do it now (will occur during rollout of email feature)
    if (!story.lastEmailMessageId) {
      await sendSubmittedEmail(story);
    }
    await sendPublishedEmail(story);
  } catch (e) {
    console.error('Error sending story submitted email', e);
  }
}

async function onStoryUserRemoved(storyId: Story['id']): Promise<void> {
  const story = await getStoryOrThrow(storyId, StoryState.USER_REMOVED);

  try {
    await sendUserRemovedEmail(story);
  } catch (e) {
    console.error('Error sending story submitted email', e);
  }
}

export async function onStateTransition(
  storyId: Story['id'],
  priorState: StoryState,
  nextState: StoryState
): Promise<void> {
  if (priorState === nextState) {
    return;
  }

  if (nextState === StoryState.SUBMITTED) {
    await onStorySubmitted(storyId);
  }

  if (nextState === StoryState.PUBLISHED) {
    await onStoryPublished(storyId);
  }

  if (nextState === StoryState.USER_REMOVED) {
    await onStoryUserRemoved(storyId);
  }
}
