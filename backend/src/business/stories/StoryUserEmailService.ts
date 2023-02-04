import { URL, URLSearchParams } from 'url';
import Photo from '../../entities/Photo';
import Story from '../../entities/Story';
import EmailService, { TemplatedEmailData } from '../email/EmailService';
import StoryPublishedTemplate from '../email/templates/StoryPublishedTemplate';
import StorySubmittedTemplate from '../email/templates/StorySubmittedTemplate';
import {
  StoryEmailMetadata,
  StoryEmailTemplateData,
} from '../email/templates/StoryUserEmailTemplateData';
import required from '../utils/required';

function describePhoto(photo: Photo): string {
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
    `/stories/${story.id}/edit`,
    process.env.FRONTEND_BASE_URL
  );

  const storyEditUrlParams: URLSearchParams = new URLSearchParams();
  storyEditUrlParams.append('noWelcome', 'true');

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

function forgeStoryTemplateContext(story: Story): StoryEmailTemplateData {
  return {
    storytellerName: required(story.storytellerName, 'storytellerName'),
    photoDescription: describePhoto(story.photo),
    storyEditUrl: forgeStoryEditUrl(story),
    viewPhotoUrl: forgePhotoUrl(story.photo, story.lngLat),
  };
}

function forgeStoryMetadata(story: Story): StoryEmailMetadata {
  return {
    storyId: story.id.toString(),
  };
}

async function sendStoryUserEmail(
  story: Story,
  Template: typeof StorySubmittedTemplate
): Promise<void> {
  if (!story.photo) {
    throw new Error('Expected photo to be resolved');
  }

  const email: TemplatedEmailData = Template.createTemplatedEmail({
    to: required(story.storytellerEmail, 'storytellerEmail'),
    templateContext: forgeStoryTemplateContext(story),
    metadata: forgeStoryMetadata(story),
  });

  await EmailService.sendTemplateEmail(email);
}

export async function sendSubmittedEmail(story: Story): Promise<void> {
  return sendStoryUserEmail(story, StorySubmittedTemplate);
}

export async function sendPublishedEmail(story: Story): Promise<void> {
  return sendStoryUserEmail(story, StoryPublishedTemplate);
}
