export const TRAINER_STATUSES = ["pending", "approved", "rejected"] as const;

export type TrainerStatus = (typeof TRAINER_STATUSES)[number];

export const TRAINER_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const satisfies Record<string, TrainerStatus>;
