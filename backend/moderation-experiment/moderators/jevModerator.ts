import { OpenRouter } from '@openrouter/sdk';
import { buildNoulQuestions, buildState, combine } from '../rules';
import {
  Moderator,
  ModerationInput,
  ModerationVerdict,
  RuleKey,
} from '../types';

const DEFAULT_MODEL = 'typesafe/jev-1.13';

export default function createJevModerator(model = DEFAULT_MODEL): Moderator {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const client = new OpenRouter({ apiKey });
  const questions = buildNoulQuestions();

  return {
    name: 'jev',
    model,
    async classify(input: ModerationInput): Promise<ModerationVerdict> {
      const response = await client.alpha.decisions.create({
        decisionsRequest: {
          model,
          state: buildState(input),
          questions,
        },
      });

      const ruleProbabilities = Object.fromEntries(
        Object.keys(questions).map((key) => {
          const answer = response.answers[key];
          return [key, answer?.type === 'noul' ? answer.noul : 0];
        })
      ) as Record<RuleKey, number>;

      const { approve, approveProbability } = combine(ruleProbabilities);

      return {
        moderator: 'jev',
        model: response.model ?? model,
        approve,
        approveProbability,
        ruleProbabilities,
        costUsd: response.usage.cost ?? null,
        raw: response,
      };
    },
  };
}
