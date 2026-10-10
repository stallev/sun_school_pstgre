export const COMPLAINT_PRIORITIES = ["low", "medium", "high"] as const;

export type ComplaintPriority = (typeof COMPLAINT_PRIORITIES)[number];

export const COMPLAINT_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const satisfies Record<string, ComplaintPriority>;
