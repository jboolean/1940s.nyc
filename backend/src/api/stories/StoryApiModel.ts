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

type NewStoryRequest = Pick<
  StoryApiModel,
  'lngLat' | 'photo' | 'storyType' | 'textContent'
>;

// some fields are optional when it's a draft
type StoryDraftResponse = Optional<
  StoryApiModel,
  'storytellerEmail' | 'storytellerName' | 'storytellerSubtitle'
>;

type StoryUpdateRequest = Omit<
  StoryApiModel,
  'id' | 'lngLat' | 'photo' | 'createdAt'
>;

type PublicStoryResponse = Omit<StoryApiModel, 'storytellerEmail'>;

export {
  StoryApiModel,
  NewStoryRequest,
  StoryDraftResponse,
  StoryUpdateRequest,
  PublicStoryResponse,
};