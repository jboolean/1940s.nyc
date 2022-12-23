import api from 'shared/utils/api';
import { Story } from '../types/Story';

type NewStoryRequest = Pick<
  Story,
  'lngLat' | 'photo' | 'storyType' | 'textContent'
>;

export async function createStory(newStory: NewStoryRequest): Promise<Story> {
  const resp = await api.post<Story>('/stories', newStory);
  return resp.data;
}

export async function updateStory(updatedStory: Story): Promise<Story> {
  const resp = await api.put<Story>(
    `/stories/${updatedStory.id}`,
    updatedStory
  );
  return resp.data;
}
