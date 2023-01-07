import memoize from 'lodash/memoize';
import api from 'shared/utils/api';
import {
  AdminStory,
  Story,
  StoryDraftRequest,
} from '../../screens/App/shared/types/Story';

export async function createStory(
  newStory: StoryDraftRequest,
  { recaptchaToken }: { recaptchaToken: string }
): Promise<Story> {
  const resp = await api.post<Story>('/stories', newStory, {
    headers: { 'X-Recaptcha-Token': recaptchaToken },
  });
  return resp.data;
}

export async function updateStory(
  updatedStory: StoryDraftRequest | Story
): Promise<Story> {
  if (!updatedStory.id) {
    throw new Error('Story must already be persisted to update ito');
  }

  const resp = await api.put<Story>(
    `/stories/${updatedStory.id}`,
    updatedStory
  );
  return resp.data;
}

export const getStoriesForPhoto = memoize(async function getStoriesForPhoto(
  photoIdentifier: string
): Promise<Story[]> {
  const resp = await api.get<Story[]>(
    `/stories?forPhotoIdentifier=${photoIdentifier}`
  );
  return resp.data;
});

export const getAllStories = memoize(async function getAllStories(): Promise<
  Story[]
> {
  const resp = await api.get<Story[]>(`/stories`);
  return resp.data;
});

export async function getStoriesForReview(): Promise<AdminStory[]> {
  const resp = await api.get<AdminStory[]>('/stories/needs-review');
  return resp.data;
}

export async function updateStoryState(
  storyId: Story['id'],
  newState: Story['state']
): Promise<Story> {
  const resp = await api.patch<AdminStory>(`/stories/${storyId}/state`, {
    state: newState,
  });
  return resp.data;
}
