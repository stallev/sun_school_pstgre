export const REFUND_STATUSES = ["pending", "approved", "rejected"] as const;

export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const REFUND_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const satisfies Record<string, RefundStatus>;
