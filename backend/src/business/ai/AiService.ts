import { Configuration, OpenAIApi } from 'openai';
import createStoryTitlePrompt from './createStoryTitlePrompt';
const configuration = new Configuration({
  organization: 'org-TEbKEsj2LQsKAmHZRs1MoHHh',
  apiKey: process.env.OPENAI_SK,
});
const openai = new OpenAIApi(configuration);

export async function suggestStoryTitle(storyContent: string): Promise<string> {
  const response = await openai.createCompletion(
    createStoryTitlePrompt(storyContent)
  );

  return response.data.choices[0].text ?? '';
}
