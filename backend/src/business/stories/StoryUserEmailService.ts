import { URL, URLSearchParams } from 'url';
import Story from '../../entities/Story';
import EmailService, { TemplatedEmailData } from '../email/EmailService';
import StorySubmittedTemplate from '../email/templates/StorySubmittedTemplate';
import required from '../utils/required';

function forgeStoryEditUrl(story: Story): string {
  const storyEditUrl: URL = new URL(
    `/story/${story.id}/edit`,
    process.env.FRONTEND_BASE_URL
  );

  const storyEditUrlParams: URLSearchParams = new URLSearchParams();
  storyEditUrlParams.append('noWelcome', 'true');

  storyEditUrl.search = storyEditUrlParams.toString();
  return storyEditUrl.toString();
}

export async function sendSubmittedEmail(story: Story): Promise<void> {
  if (!story.photo) {
    throw new Error('Expected photo to be resolved');
  }

  const storyEditUrl: string = forgeStoryEditUrl(story);

  const email: TemplatedEmailData = StorySubmittedTemplate.createTemplatedEmail(
    {
      to: required(story.storytellerEmail, 'storytellerEmail'),
      templateContext: {
        storytellerName: required(story.storytellerName, 'storytellerName'),
        photoDescription: story.photo.identifier,
        storyEditUrl,
      },
      metadata: {
        storyId: story.id.toString(),
      },
    }
  );

  await EmailService.sendTemplateEmail(email);
}
