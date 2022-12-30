import api from 'shared/utils/api';
import { Story, StoryDraftRequest } from '../types/Story';

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
