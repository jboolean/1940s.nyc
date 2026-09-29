export const MIN_VALID_PROBABILITY = 0.5;

export const ADDRESS_QUESTION = {
  type: 'noul' as const,
  instructions:
    'The input is a single street address consisting of only a house number and a street name. It must have both parts: a house number alone, a street name alone, or a building or place name is false. Any additional text -- a city, borough, state, ZIP code, apartment or unit, business name, or commentary -- makes it false.',
};

export function buildNoulQuestions(): Record<
  'isStreetAddress',
  typeof ADDRESS_QUESTION
> {
  return { isStreetAddress: ADDRESS_QUESTION };
}

export function buildState(address: string): Record<string, unknown> {
  return { address };
}
