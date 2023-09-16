import { Photo } from 'shared/utils/photosApi';

export enum StoryType {
  TEXT = 'text',
}

export interface LngLat {
  lng: number;
  lat: number;
}

export enum StoryState {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  USER_REMOVED = 'user_removed',
}

export interface Story {
  id: number;
  createdAt: string;
  storyType: StoryType;
  storytellerEmail: string;
  storytellerName: string;
  storytellerSubtitle: string;
  lngLat?: LngLat;
  photo: string;
  photoExpanded: Photo;
  state: StoryState;
  textContent?: string;
}

export type StoryDraftRequest = {
  id?: number;
  storyType: StoryType;
  storytellerEmail?: string;
  storytellerName?: string;
  storytellerSubtitle?: string;
  lngLat?: LngLat;
  photo: string;
  state: StoryState.DRAFT;
  textContent?: string;
};

export type AdminStory = Story & {
  recaptchaScore: number;
  title?: string;
  emailBounced: boolean;
};
