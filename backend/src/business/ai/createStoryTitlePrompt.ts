import { CreateCompletionRequest } from 'openai';

export default function createStoryTitlePrompt(
  storyContent: string
): CreateCompletionRequest {
  return {
    model: 'text-davinci-003',
    prompt: `Create a very short caption for each story

Story: I lived in the building with the peak from my birth in 1948 until I was 13 in 1961, with my parents and siblings.  The 3 windows right above the Bohack sign were in my parents bedroom.  My fathers parents and my aunts and uncles lived on Grattan St in various apartments over the years.  Those are the buildings to the left of my house. Very sad to see it now.
Caption: My childhood home

Story: The Tepedino's,  Michael and Angelina. ITALIAN immigrants from the Salerno area of Italy raised 3 children in this home.
Caption: Italian immigrants raised family

Story: That's old man Saso sitting on the stoop of 35 Snediker ave. He sat there every day for years.
Caption: Man sat daily on stoop

Story: ${storyContent.replaceAll('\n', ' ').trim()}
Caption:`,
    temperature: 0.1,
    max_tokens: 8,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: ['\n'],
  };
}
