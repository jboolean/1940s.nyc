import { OpenRouter } from '@openrouter/sdk';
import Story from '../../entities/Story';
import StoryRepository from '../../repositories/StoryRepository';
import {
  buildNoulQuestions,
  buildState,
  combine,
  AiModerationFlag,
} from './moderationRules';

const MODEL = 'typesafe/jev-1.13';

const client = new OpenRouter({ apiKey: process.env.OPENROUTER_SK });
const questions = buildNoulQuestions();

export async function evaluateStory(story: Story): Promise<void> {
  const response = await client.alpha.decisions.create({
    decisionsRequest: {
      model: MODEL,
      state: buildState({
        storyType: story.storyType,
        storytellerName: story.storytellerName,
        storytellerSubtitle: story.storytellerSubtitle,
        textContent: story.textContent ?? '',
      }),
      questions,
    },
  });

  const ruleProbabilities = Object.fromEntries(
    Object.keys(questions).map((key) => {
      const answer = response.answers[key];
      return [key, answer?.type === 'noul' ? answer.noul : 0];
    })
  ) as Record<AiModerationFlag, number>;

  const { approveProbability } = combine(ruleProbabilities);

  await StoryRepository().update(story.id, {
    aiModerationScore: {
      model: response.model ?? MODEL,
      evaluatedAt: new Date().toISOString(),
      costUsd: response.usage.cost ?? null,
      approveProbability,
      ruleProbabilities,
    },
  });
}
