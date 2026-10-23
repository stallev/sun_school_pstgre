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
