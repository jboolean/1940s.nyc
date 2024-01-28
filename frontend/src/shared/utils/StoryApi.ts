import memoize from 'lodash/memoize';
import Paginated from 'shared/types/Paginated';
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
  updatedStory: StoryDraftRequest | Story,
  storyAuthToken?: string
): Promise<Story> {
  if (!updatedStory.id) {
    throw new Error('Story must already be persisted to update ito');
  }

  const resp = await api.put<Story>(
    `/stories/${updatedStory.id}`,
    updatedStory,
    {
      headers: {
        'X-Story-Token': storyAuthToken,
      },
    }
  );
  return resp.data;
}

export const getStoriesForPhoto = memoize(async function getStoriesForPhoto(
  photoIdentifier: string
): Promise<Paginated<Story>> {
  const resp = await api.get<Paginated<Story>>(
    `/stories?forPhotoIdentifier=${photoIdentifier}`
  );
  return resp.data;
});

/**
 * Get the story of the id encoded in the auth token for editing
 * @param storyAuthToken
 * @returns
 */
export async function getStoryByToken(storyAuthToken: string): Promise<Story> {
  const resp = await api.get<Story>(`/stories/by-token`, {
    headers: {
      'X-Story-Token': storyAuthToken,
    },
  });
  return resp.data;
}

export const getAllStories = async function getAllStories(
  pageSize = 100,
  pageToken?: string
): Promise<Paginated<Story>> {
  const resp = await api.get<Paginated<Story>>(`/stories`, {
    params: {
      pageToken,
      pageSize,
    },
  });
  return resp.data;
};

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
