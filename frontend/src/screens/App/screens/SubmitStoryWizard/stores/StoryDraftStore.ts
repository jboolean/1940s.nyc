import { isNil, pick } from 'lodash';
import useFeatureFlagsStore from 'screens/App/shared/stores/FeatureFlagsStore';
import FeatureFlag from 'screens/App/shared/types/FeatureFlag';
import { executeRecaptcha } from 'shared/utils/grecaptcha';
import create from 'zustand';
import { immer } from 'zustand/middleware/immer';

import {
  Story,
  StoryDraftRequest,
  StoryState,
  StoryType,
} from 'screens/App/shared/types/Story';
import {
  createStory,
  getStoryByToken,
  updateStory,
} from '../../../../../shared/utils/StoryApi';
import Step from '../shared/types/Step';
import useStorytellerInfoStore from './StorytellerInfoStore';

interface State {
  isOpen: boolean;
  step: Step;
  isSaving: boolean;

  draftStory: Partial<Story>;
  storyAuthToken?: string;
}

interface ComputedState {
  isValidToSubmit: boolean;
  isValidToSaveContentDraft: boolean;
}

interface Actions {
  initialize: (photo: string) => void;
  rehydrateForEditing: (storyAuthToken: string) => void;
  close: () => void;
  beginTextStory: () => void;
  setTextContent: (newTextContent: string) => void;
  saveContent: () => void;
  setStorytellerName: (newStorytellerName: string) => void;
  setStorytellerSubtitle: (newStorytellerSubtitle: string) => void;
  setStorytellerEmail: (newStorytellerEmail: string) => void;
  submitStorytellerInfo: () => void;
  goBackToContentStep: () => void;
  markUserRemoved: () => void;
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

    initialize: (photo: string) => {
      set((draft) => {
        const initialStorytellerInfo = pick(
          useStorytellerInfoStore.getState(),
          'storytellerName',
          'storytellerSubtitle',
          'storytellerEmail'
        );
        draft.draftStory = {
          ...initialStorytellerInfo,
        };
        draft.draftStory.photo = photo;
        draft.isOpen = true;
        draft.step = Step.INTRO;
        draft.isSaving = false;
      });

      if (!useFeatureFlagsStore.getState()[FeatureFlag.AUDIO_STORYTELLING]) {
        // Since there's no audio stories yet, skip the intro and go to the text content step
        get().beginTextStory();
      }
    },

    rehydrateForEditing: async (storyAuthToken: string) => {
      const story = await getStoryByToken(storyAuthToken);

      set((draft) => {
        draft.draftStory = story;
        draft.isOpen = true;
        draft.step = Step.CONTENT_TEXT;
        draft.isSaving = false;

        draft.storyAuthToken = storyAuthToken;
      });
    },

    close: () => {
      const draftStory = get().draftStory;
      const consentedToClose =
        draftStory.state === StoryState.SUBMITTED ||
        draftStory.state === StoryState.PUBLISHED ||
        (draftStory.storyType === StoryType.TEXT && !draftStory.textContent);
      window.confirm(
        'Are you sure you want to exit? Your story will not be saved.'
      );

      if (consentedToClose) {
        set((draft) => {
          draft.isOpen = false;
        });
      }
    },

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
      const storyAuthToken = get().storyAuthToken;
      const {
        lngLat,
        storyType,
        textContent,
        photo,
        storytellerName,
        storytellerEmail,
        storytellerSubtitle,
      } = draftStory;

      try {
        set((draft) => {
          draft.isSaving = true;
        });

        // create if not yet created, otherwise update
        if (isNil(draftStory.id)) {
          const recaptchaToken = await executeRecaptcha('create_story');

          const createdStory = await createStory(
            {
              lngLat,
              storyType,
              textContent,
              photo,
              storytellerName,
              storytellerEmail,
              storytellerSubtitle,
              state: StoryState.DRAFT,
            },
            { recaptchaToken }
          );

          set((draft) => {
            draft.draftStory = createdStory;
            draft.step = Step.STORYTELLER_INFO;
          });
        } else {
          // Story must return to a user-updatible state (i.e. not StoryState.PUBLISHED)
          const newState = ![StoryState.DRAFT, StoryState.SUBMITTED].includes(
            draftStory.state
          )
            ? StoryState.DRAFT
            : draftStory.state;

          const updatedStory = await updateStory(
            { ...draftStory, state: newState } as StoryDraftRequest,
            storyAuthToken
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
        const updatedStory = await updateStory(
          {
            ...draftStory,
            state: StoryState.SUBMITTED,
          },
          get().storyAuthToken
        );
        set((draft) => {
          draft.draftStory = updatedStory;
          draft.step = Step.THANK_YOU;
        });

        // persist storyteller info in local storage
        useStorytellerInfoStore.setState({
          storytellerName: draftStory.storytellerName,
          storytellerSubtitle: draftStory.storytellerSubtitle,
          storytellerEmail: draftStory.storytellerEmail,
        });
      } finally {
        set((draft) => {
          draft.isSaving = false;
        });
      }
    },

    goBackToContentStep: () => {
      set((draft) => {
        if (draft.draftStory.storyType === StoryType.TEXT) {
          draft.step = Step.CONTENT_TEXT;
        } else {
          throw new Error('No step for story type');
        }
      });
    },

    markUserRemoved: async () => {
      const userConfirmed = window.confirm(
        'Are you sure you want to remove this story? You can always come back to this link and submit it again.'
      );

      if (!userConfirmed) {
        return;
      }

      const draftStory = get().draftStory;
      const storyAuthToken = get().storyAuthToken;

      const updatedStory = await updateStory(
        { ...draftStory, state: StoryState.USER_REMOVED } as Story,
        storyAuthToken
      );

      set((draft) => {
        draft.draftStory = updatedStory;
        draft.isOpen = false;
      });
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
