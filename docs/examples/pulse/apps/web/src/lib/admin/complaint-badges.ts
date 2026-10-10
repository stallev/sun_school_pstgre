import { COMPLAINT_PRIORITY, COMPLAINT_RESOLUTION, COMPLAINT_STATUS } from "@pulse/domain";

import type { Messages } from "@/lib/messages/types";
import type { StatusBadgeVariant } from "@/lib/ui/status-badge";

export function getComplaintPriorityBadge(
  priority: string,
  messages: Messages,
): {
  variant: StatusBadgeVariant;
  label: string;
} {
  if (priority === COMPLAINT_PRIORITY.HIGH) {
    return {
      variant: "cancelled",
      label: messages.admin.complaints.priority.high,
    };
  }

  if (priority === COMPLAINT_PRIORITY.MEDIUM) {
    return {
      variant: "pending",
      label: messages.admin.complaints.priority.medium,
    };
  }

  return {
    variant: "neutral",
    label: messages.admin.complaints.priority.low,
  };
}

export function getComplaintStatusBadge(
  status: string,
  messages: Messages,
): {
  variant: StatusBadgeVariant;
  label: string;
} {
  if (status === COMPLAINT_STATUS.OPEN) {
    return {
      variant: "pending",
      label: messages.admin.complaints.statusOpen,
    };
  }

  if (status === COMPLAINT_STATUS.IN_REVIEW) {
    return {
      variant: "info",
      label: messages.admin.complaints.statusInReview,
    };
  }

  if (status === COMPLAINT_STATUS.CLOSED) {
    return {
      variant: "completed",
      label: messages.admin.complaints.statusClosed,
    };
  }

  return { variant: "neutral", label: status };
}

export function getComplaintResolutionBadge(
  resolution: string,
  messages: Messages,
): {
  variant: StatusBadgeVariant;
  label: string;
} {
  const labels = messages.admin.complaints.resolution;

  switch (resolution) {
    case COMPLAINT_RESOLUTION.NO_ACTION:
      return { variant: "neutral", label: labels.noAction };
    case COMPLAINT_RESOLUTION.WARNING_TO_TRAINER:
      return { variant: "pending", label: labels.warningToTrainer };
    case COMPLAINT_RESOLUTION.REFUND_RECOMMENDED:
      return { variant: "info", label: labels.refundRecommended };
    case COMPLAINT_RESOLUTION.DUPLICATE:
      return { variant: "neutral", label: labels.duplicate };
    case COMPLAINT_RESOLUTION.SPAM:
      return { variant: "cancelled", label: labels.spam };
    default:
      return { variant: "neutral", label: resolution };
  }
}
