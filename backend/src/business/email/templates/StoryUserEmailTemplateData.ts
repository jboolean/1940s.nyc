export interface StoryEmailTemplateData {
  storytellerName: string;
  photoDescription: string;
  storyEditUrl: string;
  viewPhotoUrl: string;
  photoThumbnailUrl: string;
  mapImageUrl: string | null;
  mapImageUrlRetina: string | null;
  isPublished: boolean;
}

export interface StoryEmailMetadata {
  storyId: string;
}
