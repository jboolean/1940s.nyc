import { URL, URLSearchParams } from 'url';
import Photo from '../../entities/Photo';
import Story from '../../entities/Story';
import StoryRepository from '../../repositories/StoryRepository';
import EmailService, { TemplatedEmailData } from '../email/EmailService';
import EmailTemplate from '../email/EmailTemplate';
import StoryPublishedTemplate from '../email/templates/StoryPublishedTemplate';
import StorySubmittedAgainTemplate from '../email/templates/StorySubmittedAgainTemplate';
import StorySubmittedTemplate from '../email/templates/StorySubmittedTemplate';
import {
  StoryEmailMetadata,
  StoryEmailTemplateData,
} from '../email/templates/StoryUserEmailTemplateData';
import StoryUserRemovedTemplate from '../email/templates/StoryUserRemovedTemplate';
import forgeStaticMapUrl from '../utils/forgeStaticMapUrl';
import required from '../utils/required';
import { createStoryToken } from './StoryTokenService';

function describePhoto(photo: Photo): string {
  if (photo.effectiveAddress?.address) {
    return photo.effectiveAddress.address;
  }

  if (photo.address) {
    return photo.address;
  }

  if (photo.block && photo.lot && photo.borough) {
    return `Block ${photo.block} Lot ${photo.lot}, ${photo.borough}`;
  }

  if (photo.isOuttake) {
    return `outtake ${photo.identifier}`;
  }

  return photo.identifier;
}

function forgeStoryEditUrl(story: Story): string {
  const storyEditUrl: URL = new URL(
    `/stories/edit`,
    process.env.FRONTEND_BASE_URL
  );

  const storyEditUrlParams: URLSearchParams = new URLSearchParams();
  storyEditUrlParams.append('noWelcome', 'true');
  storyEditUrlParams.append('token', createStoryToken(story.id));

  storyEditUrl.search = storyEditUrlParams.toString();
  return storyEditUrl.toString();
}

function forgePhotoUrl(photo: Story['photo'], lngLat: Story['lngLat']): string {
  const storyEditUrl: URL = new URL(
    `/map/photo/${photo.identifier}`,
    process.env.FRONTEND_BASE_URL
  );

  const storyEditUrlParams: URLSearchParams = new URLSearchParams();
  storyEditUrlParams.append('noWelcome', 'true');

  if (lngLat) {
    storyEditUrl.hash = `16/${lngLat.lat}/${lngLat.lng}`;
  }

  storyEditUrl.search = storyEditUrlParams.toString();
  return storyEditUrl.toString();
}

function forgeImageThumbnailUrl(photo: Story['photo']): string {
  return `https://photos.1940s.nyc/420-jpg/${photo.identifier}.jpg`;
}

function forgeMapImageUrl(
  photo: Story['photo'],
  lngLat: Story['lngLat'],
  retina = false
): string | null {
  if (!lngLat) {
    return null;
  }
  return forgeStaticMapUrl(photo.identifier, lngLat, 315, 315, 16, retina);
}

function forgeStoryTemplateContext(story: Story): StoryEmailTemplateData {
  return {
    storytellerName: required(story.storytellerName, 'storytellerName'),
    photoDescription: describePhoto(story.photo),
    storyEditUrl: forgeStoryEditUrl(story),
    viewPhotoUrl: forgePhotoUrl(story.photo, story.lngLat),
    photoThumbnailUrl: forgeImageThumbnailUrl(story.photo),
    mapImageUrl: forgeMapImageUrl(story.photo, story.lngLat, false),
    mapImageUrlRetina: forgeMapImageUrl(story.photo, story.lngLat, true),
  };
}

function forgeStoryMetadata(story: Story): StoryEmailMetadata {
  return {
    storyId: story.id.toString(),
  };
}

async function sendStoryUserEmail(
  story: Story,
  Template: EmailTemplate<StoryEmailTemplateData, StoryEmailMetadata>
): Promise<void> {
  if (!story.photo) {
    throw new Error('Expected photo to be resolved');
  }

  const email: TemplatedEmailData = Template.createTemplatedEmail({
    to: required(story.storytellerEmail, 'storytellerEmail'),
    templateContext: forgeStoryTemplateContext(story),
    metadata: forgeStoryMetadata(story),
    referenceMessageId: story.lastEmailMessageId ?? undefined,
  });

  const { messageId } = await EmailService.sendTemplateEmail(email);

  // Store last message id so we can thread messages
  await StoryRepository().update(story.id, { lastEmailMessageId: messageId });
}

export async function sendSubmittedEmail(story: Story): Promise<void> {
  return sendStoryUserEmail(story, StorySubmittedTemplate);
}

export async function sendSubmittedAgainEmail(story: Story): Promise<void> {
  return sendStoryUserEmail(story, StorySubmittedAgainTemplate);
}

export async function sendPublishedEmail(story: Story): Promise<void> {
  return sendStoryUserEmail(story, StoryPublishedTemplate);
}

export async function sendUserRemovedEmail(story: Story): Promise<void> {
  return sendStoryUserEmail(story, StoryUserRemovedTemplate);
}
