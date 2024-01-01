import OpenAI from 'openai';

export default function createStoryTitlePrompt(
  storyContent: string
): OpenAI.ChatCompletionCreateParamsNonStreaming {
  return {
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content:
          'You turn stories into captions. User input is a story about an old photo of a building in NYC. You respond with no more than 6 words to caption the story or label the map marker for the place. Personality: charming, curious, catchy, succinct. \nRespond with NO surrounding quotes.',
      },
      {
        role: 'user',
        content:
          'I lived in the building with the peak from my birth in 1948 until I was 13 in 1961, with my parents and siblings.  The 3 windows right above the Bohack sign were in my parents bedroom.  My fathers parents and my aunts and uncles lived on Grattan St in various apartments over the years.  Those are the buildings to the left of my house. Very sad to see it now.',
      },
      {
        role: 'assistant',
        content: 'My childhood home',
      },
      {
        role: 'user',
        content:
          "The Tepedino's,  Michael and Angelina. ITALIAN immigrants from the Salerno area of Italy raised 3 children in this home.",
      },
      {
        role: 'assistant',
        content: 'Italian immigrants raised family',
      },
      {
        role: 'user',
        content: 'The plaza hotel',
      },
      {
        role: 'assistant',
        content: 'Plaza Hotel',
      },
      {
        role: 'user',
        content:
          "That's old man Saso sitting on the stoop of 35 Snediker ave. He sat there every day for years.",
      },
      {
        role: 'assistant',
        content: 'Man sat daily on stoop',
      },
      {
        role: 'user',
        content: storyContent,
      },
    ],
    temperature: 0.2,
    max_tokens: 15,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  };
}
