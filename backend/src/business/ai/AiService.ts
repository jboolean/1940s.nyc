import OpenAI from 'openai';
import * as Sentry from '@sentry/node';
import createStoryTitlePrompt from './createStoryTitlePrompt';

const openai = new OpenAI({
  organization: 'org-TEbKEsj2LQsKAmHZRs1MoHHh',
  apiKey: process.env.OPENAI_SK,
});

export async function suggestStoryTitle(storyContent: string): Promise<string> {
  const prompt = createStoryTitlePrompt(storyContent);
  const model = typeof prompt.model === 'string' ? prompt.model : 'unknown';
  const aiSpan = Sentry.getCurrentHub()
    .getScope()
    ?.getTransaction()
    ?.startChild({
      op: 'gen_ai.request',
      description: `OpenAI chat completion (${model})`,
    });
  aiSpan?.setData('gen_ai.request.model', model);

  try {
    const response = await openai.chat.completions.create(prompt);

    if (response.usage) {
      aiSpan?.setData(
        'gen_ai.usage.input_tokens',
        response.usage.prompt_tokens
      );
      aiSpan?.setData(
        'gen_ai.usage.output_tokens',
        response.usage.completion_tokens
      );
    }

    return response.choices[0].message.content?.trim() ?? '';
  } catch (error) {
    aiSpan?.setStatus('internal_error');
    throw error;
  } finally {
    aiSpan?.finish();
  }
}
