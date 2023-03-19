import { IsNull, Not } from 'typeorm';
import StoryRepository from '../repositories/StoryRepository';
import * as AiService from '../business/ai/AiService';

const LIMIT = 20;

export default async function generateStoryTitles(): Promise<void> {
  const repository = StoryRepository();
  const stories = await repository
    .createQueryBuilder('story')
    .where({ title: IsNull(), textContent: Not(IsNull()) })
    .limit(LIMIT)
    .getMany();

  const promises = stories.map(async (story) => {
    const textContent = story.textContent;
    if (!textContent) return;

    try {
      const suggestedTitle = await AiService.suggestStoryTitle(textContent);

      await repository.update(story.id, {
        title: suggestedTitle,
        updatedAt: story.updatedAt,
      });
    } catch (e) {
      console.warn('Could not generate title for story', story.id, e);
    }
  });

  await Promise.allSettled(promises);
}
