import { AppDataSource } from '../../createConnection';
import Story from '../../entities/Story';
import User from '../../entities/User';
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
  const userRepository = AppDataSource.getRepository(User);

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

  try {
    // If user with this email is banned, reject the story
    const maybeUser = await userRepository.findOneBy({
      email: story.storytellerEmail ?? '',
    });
    const isUserBanned = maybeUser?.isBanned ?? false;
    if (isUserBanned) {
      await StoryRepository().update(story.id, {
        state: StoryState.REJECTED,
        lastReviewer: 'system',
      });
    }
  } catch (e) {
    console.error('Error auto-reviewing story', e);
  }
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

export async function backfillUserStoryEmails(): Promise<void> {
  const stories = await StoryRepository().findForEmailBackfill();

  for (const story of stories) {
    console.log('Backfilling story', story.id);
    if (story.lastEmailMessageId) {
      continue;
    }

    try {
      await sendSubmittedEmail(story);
      await StoryRepository().update(story.id, {
        hasEverSubmitted: true,
      });

      if (story.state === StoryState.PUBLISHED) {
        await sendPublishedEmail(story);
      }
    } catch (e) {
      console.error('Could not backfill ', story, e);
    }
  }
}
