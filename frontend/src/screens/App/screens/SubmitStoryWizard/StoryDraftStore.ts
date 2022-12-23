import { isNil } from 'lodash';
import create from 'zustand';
import { immer } from 'zustand/middleware/immer';

import Step from './shared/types/Step';
import { Story, StoryState, StoryType } from './shared/types/Story';
import { createStory, updateStory } from './shared/utils/StoryApi';

interface State {
  isOpen: boolean;
  step: Step;
  isSubmitting: boolean;

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
    draftStory: {},
    isSubmitting: false,

    initialize: (photo: string) =>
      set((draft) => {
        draft.draftStory = {};
        draft.draftStory.photo = photo;
        draft.isOpen = true;
        draft.step = Step.INTRO;
        draft.isSubmitting = false;
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
      const { lngLat, storyType, textContent, photo } = get().draftStory;

      try {
        set((draft) => {
          draft.isSubmitting = true;
        });

        // create if not yet created, otherwise update

        const createdStory = await createStory({
          lngLat,
          storyType,
          textContent,
          photo,
        });
        set((draft) => {
          draft.draftStory = createdStory;
          draft.step = Step.STORYTELLER_INFO;
        });
      } finally {
        set((draft) => {
          draft.isSubmitting = false;
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
          draft.isSubmitting = true;
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
          draft.isSubmitting = false;
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
