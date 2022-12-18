import LngLat from '../../enum/LngLat';
import StoryState from '../../enum/StoryState';
import StoryType from '../../enum/StoryType';

type Optional<T, P extends keyof T> = Omit<T, P> & Partial<Pick<T, P>>;

interface StoryApiModel {
  id: number;
  createdAt: string;
  storyType: StoryType;
  storytellerEmail: string;
  storytellerName: string;
  storytellerSubtitle: string;
  lngLat?: LngLat;
  photo: string;
  state: StoryState;
  textContent?: string;
}

// Can never be set by user
type NonUserSettableFields = 'id' | 'createdAt';

// some fields are optional when it's a draft
type DraftOptionalFields =
  | 'storytellerEmail'
  | 'storytellerName'
  | 'storytellerSubtitle';

type NonPublicFields = 'storytellerEmail';

type NewStoryRequest = Pick<
  StoryApiModel,
  'lngLat' | 'photo' | 'storyType' | 'textContent'
>;

// some fields are optional when it's a draft
type StoryDraftResponse = Optional<StoryApiModel, DraftOptionalFields>;

type StoryUpdateRequest = Omit<
  StoryApiModel,
  (NonUserSettableFields & 'lngLat') | 'photo'
>;

type PublicStoryResponse = Omit<StoryApiModel, NonPublicFields>;

export {
  StoryApiModel,
  NewStoryRequest,
  StoryDraftResponse,
  StoryUpdateRequest,
  PublicStoryResponse,
};
