import { OpenRouter } from '@openrouter/sdk';
import {
  MIN_VALID_PROBABILITY,
  buildNoulQuestions,
  buildState,
} from './addressValidationRules';

const MODEL = 'typesafe/jev-1.13';

const client = new OpenRouter({ apiKey: process.env.OPENROUTER_SK });
const questions = buildNoulQuestions();

export async function isValidStreetAddress(address: string): Promise<boolean> {
  try {
    const response = await client.alpha.decisions.create({
      decisionsRequest: {
        model: MODEL,
        state: buildState(address),
        questions,
      },
    });

    const answer = response.answers.isStreetAddress;
    if (answer?.type !== 'noul') return true;

    return answer.noul >= MIN_VALID_PROBABILITY;
  } catch (err) {
    // fail open: a correction is worth more than the validation
    console.error('Address validation failed, accepting correction', err);
    return true;
  }
}
