import Photo from '../../entities/Photo';
import LngLat from '../../enum/LngLat';
import StoryState from '../../enum/StoryState';
import StoryType from '../../enum/StoryType';
import { Email } from '../CommonApiTypes';

type Optional<T, P extends keyof T> = Omit<T, P> & Partial<Pick<T, P>>;

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

type AdminFields = {
  recaptchaScore: number;
};

// Can never be set by user
// type NonUserSettableFields = 'id' | 'createdAt';

// some fields are optional when it's a draft
type DraftOptionalFields =
  | 'storytellerEmail'
  | 'storytellerName'
  | 'storytellerSubtitle';

type NonPublicFields = 'storytellerEmail';

// type StoryDraftRequest = Optional<
//   Omit<StoryApiModel, NonUserSettableFields>,
//   DraftOptionalFields
// >;

type StoryDraftRequest = {
  storyType: StoryType;
  storytellerEmail?: string;
  storytellerName?: string;
  storytellerSubtitle?: string;
  lngLat?: LngLat;
  photo: string;
  state: StoryState;
  textContent?: string;
};

type StoryDraftResponse = Optional<StoryApiModel, DraftOptionalFields>;

type PublicStoryResponse = Omit<StoryApiModel, NonPublicFields> & {
  // TODO this should NOT be using the db model, we should create an api type for photos
  // But Photos is not converted to tsoa yet, it's just using untyped express routes
  photoExpanded: Photo;
};

type AdminStoryResponse = StoryApiModel & AdminFields;

export {
  StoryApiModel,
  StoryDraftRequest,
  StoryDraftResponse,
  PublicStoryResponse,
  AdminStoryResponse,
};
