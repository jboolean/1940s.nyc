import { RuleKey } from './types';

/**
 * THE PROMPT.
 *
 * Each entry is a yes/no ("noul") question: the probability that a submission
 * should be REJECTED for that reason. Edit instructions/criteria here to
 * iterate — both moderators/jevModerator.ts and moderators/llmModerator.ts
 * read this same definition, so a change here changes both backends
 * identically.
 *
 * Combine logic: reject if ANY rule's probability >= REJECT_THRESHOLD.
 * approveProbability = 1 - max(rule probabilities).
 */
export const REJECT_THRESHOLD = 0.5;

export interface RuleDefinition {
  instructions: string;
  criteria: { true: string; false: string };
}

export const RULES: Record<RuleKey, RuleDefinition> = {
  linkOrAd: {
    instructions:
      'This submission should be rejected because it primarily links away from the site or advertises something, rather than information. Talking about history and linking to sources is okay as long as the story itself is valuable as more than a link.',
    criteria: {
      true: 'The main point is a link, URL, business promotion, or advertisement rather than a personal history or memory.',
      false:
        'The submission is a personal story or memory, even if it happens to mention a business or place by name.',
    },
  },
  complaintOrCorrection: {
    instructions:
      'This submission should be rejected because it is a complaint or a correction, not a story.',
    criteria: {
      true: 'The submission is complaining about the site/app/photo/data, or is correcting a factual detail (e.g. an address, date, or name), rather than sharing a personal story or memory.',
      false: 'The submission shares a personal story, memory, or history.',
    },
  },
  nonsense: {
    instructions:
      'This submission should be rejected because it is nonsense, gibberish, or not a coherent story.',
    criteria: {
      true: 'The text is gibberish, random characters/words, test input, or otherwise incoherent.',
      false:
        'The text is coherent, readable prose (even if short or informal).',
    },
  },
  addressOnly: {
    instructions:
      'This submission should be rejected because it merely states the address, the current business at the location, or that the author lives/lived there, with no further detail, memory, or history. Even a minor detail like a name or date makes it valid to approve.',
    criteria: {
      true: 'The entire submission is just a restatement of the location (e.g. "this is now a Dunkin Donuts" or "I live here") with no personal detail, memory, anecdote, or history beyond that.',
      false:
        'The submission includes an actual memory, anecdote, detail, or piece of history beyond simply naming the address, business, or current occupant.',
    },
  },
  offensive: {
    instructions:
      'This submission should be rejected because it contains explicit offensive, sexual, or racist content.',
    criteria: {
      true: 'The text contains explicit sexual content, racist language or slurs, or other overtly offensive material.',
      false:
        'The text contains no explicit offensive, sexual, or racist content.',
    },
  },
  trolling: {
    instructions:
      'This submission should be rejected because it is trolling: bad-faith, mocking, or intentionally disruptive, or may have been written by a child, rather than a genuine story.',
    criteria: {
      true: 'The submission appears to be a joke at the expense of the site, mockery, or intentionally disruptive/bad-faith content rather than a genuine attempt at a story.',
      false:
        'The submission is a genuine, good-faith attempt at sharing a story.',
    },
  },
};

export const RULE_KEYS = Object.keys(RULES) as RuleKey[];

export function combine(ruleProbabilities: Record<RuleKey, number>): {
  approve: boolean;
  approveProbability: number;
} {
  const rejectProbability = Math.max(
    ...RULE_KEYS.map((k) => ruleProbabilities[k])
  );
  return {
    approve: rejectProbability < REJECT_THRESHOLD,
    approveProbability: 1 - rejectProbability,
  };
}

/** The `questions` payload for Jev's Decisions API — one `noul` question per rule. */
export function buildNoulQuestions(): Record<
  RuleKey,
  {
    type: 'noul';
    instructions: string;
    criteria: { true: string; false: string };
  }
> {
  return Object.fromEntries(
    RULE_KEYS.map((key) => [
      key,
      {
        type: 'noul' as const,
        instructions: RULES[key].instructions,
        criteria: RULES[key].criteria,
      },
    ])
  ) as Record<
    RuleKey,
    {
      type: 'noul';
      instructions: string;
      criteria: { true: string; false: string };
    }
  >;
}

/** The system prompt for the LLM fallback — same rules, phrased for a chat model. */
export function buildLlmSystemPrompt(): string {
  const ruleList = RULE_KEYS.map(
    (key) =>
      `- "${key}": ${RULES[key].instructions}\n  Yes means: ${RULES[key].criteria.true}\n  No means: ${RULES[key].criteria.false}`
  ).join('\n');

  return [
    'You are moderating user-submitted stories for a neighborhood history website.',
    'You will be given the submission as a JSON object. For each rejection rule below, output the probability (0 to 1) that the rule applies to this submission — i.e. the probability that a human moderator would reject it for that specific reason.',
    'A probability near 1 means the rule clearly applies (reject for this reason). A probability near 0 means it clearly does not apply.',
    '',
    'Rules:',
    ruleList,
    '',
    'Respond with only the JSON object matching the given schema — one number per rule, no other text.',
  ].join('\n');
}

/** The structured-output JSON schema the LLM fallback must answer against. */
export function buildLlmResponseSchema(): Record<string, unknown> {
  const properties = Object.fromEntries(
    RULE_KEYS.map((key) => [
      key,
      {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: RULES[key].instructions,
      },
    ])
  );

  return {
    type: 'object',
    properties,
    required: RULE_KEYS,
    additionalProperties: false,
  };
}

export function buildState(input: {
  title: string | null;
  storyType: string;
  storytellerName: string | null;
  storytellerSubtitle: string | null;
  textContent: string;
}): Record<string, unknown> {
  // Deliberately excludes storytellerEmail (PII not relevant to the content
  // judgment, and no reason to send it to a third-party API).
  return {
    title: input.title,
    storyType: input.storyType,
    storytellerName: input.storytellerName,
    storytellerSubtitle: input.storytellerSubtitle,
    textContent: input.textContent,
  };
}
