import Story from '../../entities/Story';
import required from '../../business/utils/required';
import {
  AdminStoryResponse,
  PublicStoryResponse,
  StoryDraftResponse,
} from './StoryApiModel';
import photoToApi from '../photos/photoToApi';

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
    textContent: story.textContent ?? undefined,
    title: story.title ?? undefined,

    recaptchaScore: story.recaptchaScore,
    emailBounced: !!story.bounce,
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
    storytellerEmail: story.storytellerEmail ?? undefined,
    storytellerName: story.storytellerName ?? undefined,
    storytellerSubtitle: story.storytellerSubtitle ?? undefined,
    textContent: story.textContent ?? undefined,
  };
}

export function toPublicStoryResponse(story: Story): PublicStoryResponse {
  return {
    id: story.id,
    lngLat: story.lngLat ?? undefined,
    photo: story.photoId,
    photoExpanded: photoToApi(story.photo),
    storyType: story.storyType,
    state: story.state,
    createdAt: story.createdAt.toISOString(),
    storytellerName: required(story.storytellerName, 'storytellerName'),
    storytellerSubtitle: required(
      story.storytellerSubtitle,
      'storytellerSubtitle'
    ),
    textContent: story.textContent ?? undefined,
  };
}
