import {
  AiModerationFlag,
  RecommendedAction,
} from '../../business/moderation/moderationRules';
import LngLat from '../../enum/LngLat';
import StoryState from '../../enum/StoryState';
import StoryType from '../../enum/StoryType';
import { Email } from '../CommonApiTypes';
import { PhotoApiModel } from '../photos/PhotoApiModel';

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
  title?: string;
  emailBounced: boolean;
  moderationFlags: AiModerationFlag[];
  recommendedAction: RecommendedAction | null;
};

// Optional while the story is a draft
type DraftOptionalFields =
  | 'storytellerEmail'
  | 'storytellerName'
  | 'storytellerSubtitle';

type NonPublicFields = 'storytellerEmail';

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
  photoExpanded: PhotoApiModel;
};

type AdminStoryResponse = StoryApiModel & AdminFields;

export {
  StoryApiModel,
  StoryDraftRequest,
  StoryDraftResponse,
  PublicStoryResponse,
  AdminStoryResponse,
};
