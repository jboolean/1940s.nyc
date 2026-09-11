import { AdminStory, StoryState } from 'screens/App/shared/types/Story';
import { getStoriesForReview, updateStoryState } from 'shared/utils/StoryApi';
import create from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface State {
  stories: AdminStory[];
  isLoading: boolean;
  error: boolean;
}

interface Actions {
  approveStory(storyId: AdminStory['id']): void;
  rejectStory(storyId: AdminStory['id']): void;
  loadStories(): void;
}

const useReviewStoriesStore = create(
  immer<State & Actions>((set) => ({
    stories: [],
    isLoading: false,
    error: false,
    loadStories: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = false;
      });
      try {
        const stories = await getStoriesForReview();
        set((state) => {
          state.stories = stories;
        });
      } catch (e) {
        set((state) => {
          state.error = true;
        });
      } finally {
        set((state) => {
          state.isLoading = false;
        });
      }
    },
    approveStory: async (storyId: AdminStory['id']) => {
      await updateStoryState(storyId, StoryState.PUBLISHED);
      set((state) => {
        state.stories = state.stories.filter((story) => story.id !== storyId);
      });
    },
    rejectStory: async (storyId: AdminStory['id']) => {
      await updateStoryState(storyId, StoryState.REJECTED);
      set((state) => {
        state.stories = state.stories.filter((story) => story.id !== storyId);
      });
    },
  }))
);

export default useReviewStoriesStore;
