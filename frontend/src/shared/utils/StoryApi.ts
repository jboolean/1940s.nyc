import memoize from 'lodash/memoize';
import api from 'shared/utils/api';
import { Story, StoryDraftRequest } from '../../screens/App/shared/types/Story';

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
