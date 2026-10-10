export const COMPLAINT_STATUSES = ["open", "in_review", "closed"] as const;

export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const COMPLAINT_STATUS = {
  OPEN: "open",
  IN_REVIEW: "in_review",
  CLOSED: "closed",
} as const satisfies Record<string, ComplaintStatus>;
