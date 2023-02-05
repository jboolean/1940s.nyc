import Story from '../../entities/Story';
import required from '../../business/utils/required';
import {
  AdminStoryResponse,
  PublicStoryResponse,
  StoryDraftResponse,
} from './StoryApiModel';

export function toAdminStoryResponse(story: Story): AdminStoryResponse {
  return {
    id: story.id,
    lngLat: story.lngLat ?? undefined,
    photo: story.photoId,
    storyType: story.storyType,
    state: story.state,
    createdAt: story.createdAt.toISOString(),
    storytellerEmail: required(story.storytellerEmail, 'storytellerEmail'),
    storytellerName: required(story.storytellerName, 'storytellerName'),
    storytellerSubtitle: required(
      story.storytellerSubtitle,
      'storytellerSubtitle'
    ),
    textContent: story.textContent,

    recaptchaScore: story.recaptchaScore,
  };
}

export function toDraftStoryResponse(story: Story): StoryDraftResponse {
  return {
    id: story.id,
    lngLat: story.lngLat ?? undefined,
    photo: story.photoId,
    storyType: story.storyType,
    state: story.state,
    createdAt: story.createdAt.toISOString(),
    storytellerEmail: story.storytellerEmail,
    storytellerName: story.storytellerName,
    storytellerSubtitle: story.storytellerSubtitle,
    textContent: story.textContent,
  };
}

export function toPublicStoryResponse(story: Story): PublicStoryResponse {
  return {
    id: story.id,
    lngLat: story.lngLat ?? undefined,
    photo: story.photoId,
    photoExpanded: story.photo,
    storyType: story.storyType,
    state: story.state,
    createdAt: story.createdAt.toISOString(),
    storytellerName: required(story.storytellerName, 'storytellerName'),
    storytellerSubtitle: required(
      story.storytellerSubtitle,
      'storytellerSubtitle'
    ),
    textContent: story.textContent,
  };
}
