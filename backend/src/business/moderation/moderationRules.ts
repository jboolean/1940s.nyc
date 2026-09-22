export type AiModerationFlag =
  | 'linkOrAd'
  | 'complaintOrCorrection'
  | 'nonsense'
  | 'addressOnly'
  | 'offensive'
  | 'trolling';

// Below neutral (0.5) on purpose: auto-publishing something a human would
// have rejected is costly, while a false reject just waits for review.
// Re-tune with moderation-experiment.
export const MIN_REJECT_PROBABILITY = 0.3;

// Separate, higher bar for showing a flag badge on the admin review screen.
// Advisory only -- it never auto-publishes or auto-rejects anything.
export const MIN_FLAG_PROBABILITY = 0.5;

export interface RuleDefinition {
  instructions: string;
  criteria: { true: string; false: string };
}

/**
 * THE PROMPT.
 *
 * Each entry is a yes/no ("noul") question about a property of the
 * submission.
 *
 * Mirrors moderation-experiment/rules.ts. Keep both in sync.
 */
export const RULES: Record<AiModerationFlag, RuleDefinition> = {
  linkOrAd: {
    instructions:
      'This submission is primarily a link away from the site or an advertisement for something, rather than information. A submission that shares real historical or informative content and includes a URL only as a supporting citation (a source for further reading, e.g. a Wikipedia page, news article, or old listing) is NOT an ad -- that is normal, encouraged sourcing. This is true only when the link/URL itself is the actual point of the submission, or the text is promotional copy for a current business (hours, deals, "visit us"), rather than genuine information about the place.',
    criteria: {
      true: 'The main point is a link, URL, current business promotion, or advertisement (e.g. "check out our new menu, link below") rather than history or information -- remove the link and there is nothing informative left.',
      false:
        'The submission shares real historical or informative content about the place (even briefly) and any URL present is just a cited source backing that content up -- remove the link and the informative content still stands.',
    },
  },
  complaintOrCorrection: {
    instructions:
      'This submission\'s point is to correct or complain about the site\'s existing data (the pin, address, photo placement, or a caption) rather than to tell a story -- even if it also includes some supporting detail explaining the correction. This is also true of a note explicitly addressed to site staff/the webmaster (e.g. "please redact this, I\'m including this for the webmaster", "please disregard my previous post"). This is different from simply mentioning a date or how long something has been true, which is not a correction.',
    criteria: {
      true: 'The submission\'s point is that existing information (the pin location, address, a caption, or a previous post) is wrong and should be fixed -- e.g. "This house is actually on Mosholu Ave, it\'s 5701 Mosholu Ave", "The address on the map is WRONG, this is 14th Ave..." -- even if it explains why or adds a supporting detail. Also true for a complaint about the website/app/photo quality, a direct request to add/change specific information, a note addressed to site staff/the webmaster, or a submission that is ONLY a bare question/uncertain guess with no actual place information given (e.g. "does anyone know what happened to...?", "Maxie\'s?"). This does NOT apply to a submission that shares real content (a family name, a memory, a specific detail) even if phrased with some uncertainty or as a search/inquiry (e.g. "I think my uncle and aunt lived in this house with my cousins" is a family story, not a bare question, even though it includes "I think").',
      false:
        'The submission shares a personal story, memory, or history without its point being to correct the site\'s existing data -- including simply stating how long something has been true or when a change happened (e.g. "an apartment building as of 2024, and has been since at least 1985"), which is historical detail, not a correction.',
    },
  },
  nonsense: {
    instructions:
      'This submission is nonsense, gibberish, or not a coherent story.',
    criteria: {
      true: 'The text is gibberish, random characters/words, test input, or otherwise incoherent.',
      false:
        'The text is coherent, readable prose (even if short or informal).',
    },
  },
  addressOnly: {
    instructions:
      'These are captions on OLD (1940s-era) photos. This is true when the submission is about the PRESENT DAY and nothing more. It is TRUE of a submission built around a raw street address with a business/occupant name tacked on in a telegraphic, directory-listing style (e.g. "1951 Southern Blvd, Roy\'s Restaurant and Bar", "600 Pelham Pkwy South. Citgo Gas Station"), which reads as a current listing, not history, even with no explicit "now" -- addresses are how you\'d look up what\'s there TODAY, not a historical reference. It is also TRUE when the submission explicitly marks itself as being about the present day with nothing more (e.g. "This is currently a Chick-Fil-A"), a bare current address alone, a physical/construction status change alone (demolished, renovated, rebuilt), or the author baldly stating they themself live/work there with no other detail (e.g. "I live here", "my home!", "I own this property"). It is FALSE of a bare business/institution name ALONE, with no address attached (e.g. "Bayard-Condict Building", "PS120Q Elementary School", "St Anthony\'s Church"), which should be read by default as identifying what was THERE IN THE PHOTO -- i.e. history. It is also FALSE whenever any real history, personal anecdote, date, family/person reference, or other detail beyond a bare current-day statement is present.',
    criteria: {
      true: 'The submission is a raw street address paired with a CURRENT COMMERCIAL business name (a restaurant, store, gas station, generic retail) in telegraphic, directory-style phrasing and NOTHING ELSE beyond that (e.g. "1951 Southern Blvd, Roy\'s Restaurant and Bar", "2000 White Plains, A to Z Autosound") -- this does NOT apply if there is also a real biographical/historical detail attached (a nickname, notable person, organization, or story), even alongside an address, and does NOT apply to a public/government institution (a police/fire precinct, public school, public library, public housing project), which is worth naming for its own sake even next to an address or "now"/"currently" -- this leeway does NOT extend to a church, congregation, or other religious institution, which needs the same real detail as a commercial business for this to be false; OR explicitly frames itself as being about the present day with nothing else (a COMMERCIAL business/occupant marked "now"/"currently"/"today" with no further elaboration, a bare current address with no name, a physical/construction status change alone with no names, or the author baldly stating they themself live/lived/grew up there with no other story, e.g. "I live here", "my home!", "I own this property", "Grew up here", "Childhood home") -- a bare residency claim is not a story even with an emotional reaction to the photo comparison tacked on ("so cool", "much nicer looking", "nifty"). An explicit "was X" / "used to be X" naming a former identity is history, not current-day, even if an address is also given.',
      false:
        'The submission names a business/institution/building BY ITSELF, with no address attached and no explicit "now/currently" framing (read by default as identifying what was in the old photo, e.g. "Bayard-Condict Building", "New York Coliseum", "St. Gabriel\'s Episcopal Church") -- OR names a public/government institution (police/fire precinct, public school, public library, public housing project) even with an address or "now/currently" framing (e.g. "NYPD 77 Precinct 127 Utica Ave") -- but NOT a church/congregation/religious institution, which still needs real detail beyond the bare name+address for this to be false -- OR explicitly describes the past/history (e.g. "was a Jewish Synagogue, now Salem Church"), gives a specific date or time period, names a past resident, family, or notable person connected to the place, notes it was a filming location for a named production, makes a superlative claim (oldest, first, last), mentions a nickname/reputation, or shares a real personal anecdote/detail beyond a bare current-day statement.',
    },
  },
  offensive: {
    instructions:
      'This submission contains explicit offensive, sexual, racist, or graphically violent/disturbing content -- this is not true merely because the history it describes is sad or the neighborhood had a rough reputation.',
    criteria: {
      true: 'The text contains explicit sexual content, racist language or slurs, or a first-person or otherwise personal, visceral account of violent trauma (e.g. "I was shot", a pet killed in front of the author) that centers the shock/harm itself -- NOT a distanced historical or factual account of a notable crime, assassination, or death recounted as local history/trivia (e.g. a mob figure\'s assassination decades ago).',
      false:
        'The text contains no explicit sexual or racist content, and any violence mentioned is recounted as distanced historical fact/trivia (e.g. "Gallo was assassinated at Umbertos Clam House in 1972") rather than personal, visceral trauma -- describing a place as having had a bad reputation, being run-down, or being the site of a sad event in general terms is not itself offensive.',
    },
  },
  trolling: {
    instructions:
      'This submission is trolling: a bad-faith joke at the expense of the site/submission process itself, or an intentionally disruptive/nonsensical submission, rather than a genuine story. A story that reports a place had an unflattering nickname, bad reputation, or was disliked is NOT trolling -- that is real history, not mockery of the site.',
    criteria: {
      true: 'The submission itself is a joke aimed at the site, the submission form, or the moderator (e.g. testing the system, mocking the concept of the site), or is otherwise a bad-faith, intentionally disruptive stunt rather than an attempt at a real story.',
      false:
        'The submission is a genuine, good-faith attempt at sharing a story or fact about the place, even if that fact is that the place had a negative nickname or reputation (e.g. being called "the dumps").',
    },
  },
};

export const RULE_KEYS = Object.keys(RULES) as AiModerationFlag[];

export function combine(ruleProbabilities: Record<AiModerationFlag, number>): {
  approve: boolean;
  approveProbability: number;
} {
  const rejectProbability = Math.max(
    ...RULE_KEYS.map((k) => ruleProbabilities[k])
  );
  return {
    approve: rejectProbability < MIN_REJECT_PROBABILITY,
    approveProbability: 1 - rejectProbability,
  };
}

export function getExceededAiModerationFlags(
  ruleProbabilities: Record<AiModerationFlag, number>
): AiModerationFlag[] {
  return RULE_KEYS.filter(
    (key) => ruleProbabilities[key] >= MIN_FLAG_PROBABILITY
  );
}

export function buildNoulQuestions(): Record<
  AiModerationFlag,
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
    AiModerationFlag,
    {
      type: 'noul';
      instructions: string;
      criteria: { true: string; false: string };
    }
  >;
}

export interface ModerationInput {
  storyType: string;
  storytellerName: string | null;
  storytellerSubtitle: string | null;
  textContent: string;
}

export function buildState(input: ModerationInput): Record<string, unknown> {
  return {
    storyType: input.storyType,
    storytellerName: input.storytellerName,
    storytellerSubtitle: input.storytellerSubtitle,
    textContent: input.textContent,
  };
}

export interface AiStoryModerationScore {
  model: string;
  evaluatedAt: string;
  costUsd: number | null;
  approveProbability: number;
  ruleProbabilities: Record<AiModerationFlag, number>;
}
