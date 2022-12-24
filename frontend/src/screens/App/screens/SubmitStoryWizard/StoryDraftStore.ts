import { isNil } from 'lodash';
import create from 'zustand';
import { immer } from 'zustand/middleware/immer';

import Step from './shared/types/Step';
import {
  Story,
  StoryDraftRequest,
  StoryState,
  StoryType,
} from './shared/types/Story';
import { createStory, updateStory } from './shared/utils/StoryApi';

interface State {
  isOpen: boolean;
  step: Step;
  isSaving: boolean;

  draftStory: Partial<Story>;
}

interface ComputedState {
  isValidToSubmit: boolean;
  isValidToSaveContentDraft: boolean;
}

interface Actions {
  initialize: (photo: string) => void;
  close: () => void;
  beginTextStory: () => void;
  setTextContent: (newTextContent: string) => void;
  saveContent: () => void;
  setStorytellerName: (newStorytellerName: string) => void;
  setStorytellerSubtitle: (newStorytellerSubtitle: string) => void;
  setStorytellerEmail: (newStorytellerEmail: string) => void;
  submitStorytellerInfo: () => void;
}

const isEmail = (email: string): boolean => {
  const re = /\S+@\S+\.\S+/;
  return !!email && re.test(email);
};

const isValidToSubmit = (draftStory: Partial<Story>): draftStory is Story =>
  !isNil(draftStory.id) &&
  !!draftStory.storytellerName &&
  !!draftStory.storytellerSubtitle &&
  isEmail(draftStory.storytellerEmail);

const isValidToSaveContentDraft = (draftStory: Partial<Story>): boolean => {
  if (draftStory.storyType === StoryType.TEXT) {
    return !!draftStory.textContent;
  }
  return false;
};

const useStoryDraftStore = create(
  immer<State & Actions>((set, get) => ({
    isOpen: false,
    step: Step.INTRO,
    draftStory: {
      state: StoryState.DRAFT,
    },
    isSaving: false,

    initialize: (photo: string) =>
      set((draft) => {
        draft.draftStory = {};
        draft.draftStory.photo = photo;
        draft.isOpen = true;
        draft.step = Step.INTRO;
        draft.isSaving = false;
      }),

    close: () =>
      set((draft) => {
        draft.isOpen = false;
      }),

    beginTextStory: () =>
      set((draft) => {
        draft.step = Step.CONTENT_TEXT;
        draft.draftStory.storyType = StoryType.TEXT;
      }),

    setTextContent: (newTextContent: string) =>
      set((draft) => {
        draft.draftStory.textContent = newTextContent;
      }),

    saveContent: async () => {
      const draftStory = get().draftStory;
      const { lngLat, storyType, textContent, photo } = draftStory;

      try {
        set((draft) => {
          draft.isSaving = true;
        });

        // create if not yet created, otherwise update
        if (isNil(draftStory.id)) {
          const createdStory = await createStory({
            lngLat,
            storyType,
            textContent,
            photo,
            state: StoryState.DRAFT,
          });

          set((draft) => {
            draft.draftStory = createdStory;
            draft.step = Step.STORYTELLER_INFO;
          });
        } else {
          const updatedStory = await updateStory(
            draftStory as StoryDraftRequest
          );
          set((draft) => {
            draft.draftStory = updatedStory;
            draft.step = Step.STORYTELLER_INFO;
          });
        }
      } finally {
        set((draft) => {
          draft.isSaving = false;
        });
      }
    },

    setStorytellerName: (newStorytellerName: string) => {
      set((draft) => {
        draft.draftStory.storytellerName = newStorytellerName;
      });
    },

    setStorytellerSubtitle: (newStorytellerSubtitle: string) => {
      set((draft) => {
        draft.draftStory.storytellerSubtitle = newStorytellerSubtitle;
      });
    },

    setStorytellerEmail: (newStorytellerEmail: string) => {
      set((draft) => {
        draft.draftStory.storytellerEmail = newStorytellerEmail;
      });
    },

    getFullStoryOrThrow: () => {
      const { draftStory } = get();
      if (
        isNil(draftStory.id) ||
        !draftStory.storytellerName ||
        !draftStory.storytellerSubtitle ||
        !draftStory.storytellerEmail
      ) {
        throw new Error('Story is not ready to be submitted.');
      }
      return draftStory as Story;
    },

    submitStorytellerInfo: async () => {
      const draftStory = get().draftStory;
      if (!isValidToSubmit(draftStory)) {
        throw new Error('Story is not ready to be submitted.');
      }
      try {
        set((draft) => {
          draft.isSaving = true;
        });
        const updatedStory = await updateStory({
          ...draftStory,
          state: StoryState.SUBMITTED,
        });
        set((draft) => {
          draft.draftStory = updatedStory;
          draft.step = Step.THANK_YOU;
        });
      } finally {
        set((draft) => {
          draft.isSaving = false;
        });
      }
    },
  }))
);

export function useStoryDraftStoreComputeds(): ComputedState {
  const { draftStory } = useStoryDraftStore();
  return {
    isValidToSubmit: isValidToSubmit(draftStory),
    isValidToSaveContentDraft: isValidToSaveContentDraft(draftStory),
  };
}

export default useStoryDraftStore;
