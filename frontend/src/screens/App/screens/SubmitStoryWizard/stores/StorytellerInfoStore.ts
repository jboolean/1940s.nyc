import create from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

interface State {
  storytellerName: string;
  storytellerSubtitle: string;
  storytellerEmail: string;
}

interface Actions {
  setStorytellerName: (newStorytellerName: string) => void;
  setStorytellerSubtitle: (newStorytellerSubtitle: string) => void;
  setStorytellerEmail: (newStorytellerEmail: string) => void;
}

// Persists the storyteller info to local storage
const useStorytellerInfoStore = create(
  persist(
    immer<State & Actions>((set) => ({
      storytellerName: '',
      storytellerSubtitle: '',
      storytellerEmail: '',
      setStorytellerName: (newStorytellerName: string) => {
        set((state) => {
          state.storytellerName = newStorytellerName;
        });
      },
      setStorytellerSubtitle: (newStorytellerSubtitle: string) => {
        set((state) => {
          state.storytellerSubtitle = newStorytellerSubtitle;
        });
      },
      setStorytellerEmail: (newStorytellerEmail: string) => {
        set((state) => {
          state.storytellerEmail = newStorytellerEmail;
        });
      },
    })),
    {
      name: 'storyteller-info',
      getStorage: () => localStorage,
    }
  )
);

export default useStorytellerInfoStore;
