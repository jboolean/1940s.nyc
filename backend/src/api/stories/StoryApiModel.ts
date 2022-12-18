import LngLat from '../../enum/LngLat';
import StoryState from '../../enum/StoryState';
import StoryType from '../../enum/StoryType';

type Optional<T, P extends keyof T> = Omit<T, P> & Partial<Pick<T, P>>;

/**
 * @pattern (?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])
 */
type Email = string;

interface StoryApiModel {
  id: number;
  createdAt: string;
  storyType: StoryType;
  storytellerEmail: Email;
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
