import Story from '../../entities/Story';
import required from '../required';
import { PublicStoryResponse, StoryDraftResponse } from './StoryApiModel';

export function toDraftStoryResponse(story: Story): StoryDraftResponse {
  return {
    id: story.id,
    lngLat: story.lngLat ?? undefined,
    photo: story.photo,
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
    photo: story.photo,
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
