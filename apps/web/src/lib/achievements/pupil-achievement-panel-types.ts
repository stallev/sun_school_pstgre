export type PupilAwardRow = {
  awardId: string;
  name: string;
  tier: number;
  points: number;
  isManual: boolean;
  isRevoked: boolean;
  canRevoke: boolean;
  evidenceLabels: string[];
  reason: string | null;
};

export type PupilPenaltyRow = {
  penaltyId: string;
  name: string;
  points: number;
  status: string;
  canCancel: boolean;
};

export type SuggestionVerseView = {
  reference: string;
  text: string | null;
  dateLabel: string | null;
};

export type PupilSuggestionRow = {
  suggestionId: string;
  achievementName: string;
  tier: number;
  /** Number of lessons in the series (`evidence_check_ids` length). */
  seriesLength: number;
  /** Pre-formatted "deferred {date}" date, null when never deferred. */
  deferredDateLabel: string | null;
  verses: SuggestionVerseView[];
  /** AZ-66: confirm / defer / dismiss available to this actor. */
  canAct: boolean;
};
