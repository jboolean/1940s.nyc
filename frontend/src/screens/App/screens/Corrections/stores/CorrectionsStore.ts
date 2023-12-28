import create from 'zustand';
import { immer } from 'zustand/middleware/immer';

import useLoginStore from 'shared/stores/LoginStore';
import { getAlternatePhotos, getPhoto, Photo } from 'shared/utils/photosApi';

interface State {
  isOpen: boolean;
  photoId: string | null;
  photo: Photo | null;
  alternatesSelections: Record<string, boolean>;
}

interface ComputedState {}

interface Actions {
  initialize: (photo: string) => void;
  close: () => void;
  toggleAlternateSelection: (identifier: string) => void;
}

const useStoryDraftStore = create(
  immer<State & Actions>((set, get) => ({
    isOpen: false,
    photoId: null,
    photo: null,
    alternatesSelections: {},

    initialize: (photo: string) => {
      set((draft) => {
        draft.photoId = photo;
        draft.isOpen = true;
        draft.photo = null;
        draft.alternatesSelections = {};
      });

      useLoginStore.getState().initialize();

      getPhoto(photo)
        .then((photo) => {
          set((draft) => {
            draft.photo = photo;
          });
        })
        .catch((err) => {
          console.error(err);
        });

      getAlternatePhotos(photo)
        .then((alternates) => {
          set((draft) => {
            alternates.forEach(({ identifier }) => {
              if (identifier === photo) return;
              draft.alternatesSelections[identifier] = true;
            });
          });
        })
        .catch((err) => {
          console.error(err);
        });
    },

    close: () => {
      set((draft) => {
        draft.isOpen = false;
      });
    },

    toggleAlternateSelection: (identifier: string) => {
      set((draft) => {
        draft.alternatesSelections[identifier] =
          !get().alternatesSelections[identifier];
      });
    },
  }))
);

export function useStoryDraftStoreComputeds(): ComputedState {
  return {};
}

export default useStoryDraftStore;
