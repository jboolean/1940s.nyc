export type RuleKey =
  | 'linkOrAd'
  | 'complaintOrCorrection'
  | 'nonsense'
  | 'addressOnly'
  | 'offensive'
  | 'trolling';

export interface ModerationInput {
  title: string | null;
  storyType: string;
  storytellerName: string | null;
  storytellerSubtitle: string | null;
  textContent: string;
}

export interface ModerationVerdict {
  moderator: string;
  model: string;
  approve: boolean;
  approveProbability: number;
  ruleProbabilities: Record<RuleKey, number>;
  costUsd: number | null;
  raw?: unknown;
}

export interface Moderator {
  name: string;
  model: string;
  classify(input: ModerationInput): Promise<ModerationVerdict>;
}

export type HumanLabel = 'approved' | 'rejected';

export interface SampledStory {
  id: number;
  humanLabel: HumanLabel;
  input: ModerationInput;
}
