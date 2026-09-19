import OpenAI from 'openai';
import createStoryTitlePrompt from './createStoryTitlePrompt';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_SK,
});

export async function suggestStoryTitle(storyContent: string): Promise<string> {
  const response = await openai.chat.completions.create(
    createStoryTitlePrompt(storyContent)
  );

  return response.choices[0].message.content?.trim() ?? '';
}
