import { TRAINER_STATUS } from "@pulse/domain";

import type { Messages } from "@/lib/messages/types";
import type { StatusBadgeVariant } from "@/lib/ui/status-badge";

export function getTrainerStatusBadge(
  status: string,
  messages: Messages,
): {
  variant: StatusBadgeVariant;
  label: string;
} {
  if (status === TRAINER_STATUS.PENDING) {
    return {
      variant: "pending",
      label: messages.admin.moderation.statusPendingReview,
    };
  }

  if (status === TRAINER_STATUS.APPROVED) {
    return {
      variant: "confirmed",
      label: messages.admin.moderation.statusApproved,
    };
  }

  if (status === TRAINER_STATUS.REJECTED) {
    return {
      variant: "cancelled",
      label: messages.admin.moderation.statusRejected,
    };
  }

  return { variant: "neutral", label: status };
}
