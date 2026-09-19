import { OpenRouter } from '@openrouter/sdk';
import {
  buildLlmResponseSchema,
  buildLlmSystemPrompt,
  buildState,
  combine,
  RULE_KEYS,
} from '../rules';
import {
  Moderator,
  ModerationInput,
  ModerationVerdict,
  RuleKey,
} from '../types';

const DEFAULT_MODEL = 'openai/gpt-5.4-mini';

export default function createLlmModerator(model = DEFAULT_MODEL): Moderator {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const client = new OpenRouter({ apiKey });
  const systemPrompt = buildLlmSystemPrompt();
  const schema = buildLlmResponseSchema();

  return {
    name: 'llm',
    model,
    async classify(input: ModerationInput): Promise<ModerationVerdict> {
      const result = await client.chat.send({
        chatRequest: {
          model,
          temperature: 0,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(buildState(input)) },
          ],
          responseFormat: {
            type: 'json_schema',
            jsonSchema: {
              name: 'moderation_verdict',
              strict: true,
              schema,
            },
          },
        },
      });

      if (!('choices' in result)) {
        throw new Error('Expected a non-streaming chat response');
      }

      const content = result.choices[0]?.message?.content;
      if (typeof content !== 'string') {
        throw new Error('LLM moderation response had no text content');
      }

      const parsed = JSON.parse(content) as Record<RuleKey, number>;
      const ruleProbabilities = Object.fromEntries(
        RULE_KEYS.map((key) => [key, parsed[key] ?? 0])
      ) as Record<RuleKey, number>;

      const { approve, approveProbability } = combine(ruleProbabilities);

      return {
        moderator: 'llm',
        model: result.model ?? model,
        approve,
        approveProbability,
        ruleProbabilities,
        costUsd: result.usage?.cost ?? null,
        raw: result,
      };
    },
  };
}
