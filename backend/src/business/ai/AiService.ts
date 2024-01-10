import OpenAI from 'openai';
import createStoryTitlePrompt from './createStoryTitlePrompt';

const openai = new OpenAI({
  organization: 'org-TEbKEsj2LQsKAmHZRs1MoHHh',
  apiKey: process.env.OPENAI_SK,
});

export async function suggestStoryTitle(storyContent: string): Promise<string> {
  const response = await openai.chat.completions.create(
    createStoryTitlePrompt(storyContent)
  );

  return response.choices[0].message.content?.trim() ?? '';
}
