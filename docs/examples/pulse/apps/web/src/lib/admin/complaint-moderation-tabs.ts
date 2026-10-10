import {
  COMPLAINT_STATUS,
  type ComplaintStatus,
} from "@pulse/domain";

import type { Messages } from "@/lib/messages/types";

export type ComplaintModerationTabConfig = {
  value: ComplaintStatus;
  label: string;
  emptyMessage: string;
};

export function getComplaintModerationTabs(
  messages: Messages,
): ComplaintModerationTabConfig[] {
  return [
    {
      value: COMPLAINT_STATUS.OPEN,
      label: messages.admin.complaints.tabs.open,
      emptyMessage: messages.admin.complaints.emptyOpen,
    },
    {
      value: COMPLAINT_STATUS.IN_REVIEW,
      label: messages.admin.complaints.tabs.inReview,
      emptyMessage: messages.admin.complaints.emptyInReview,
    },
  ];
}

export function resolveComplaintTab(
  tabParam: string | undefined,
  messages: Messages,
): ComplaintStatus {
  return (
    getComplaintModerationTabs(messages).find((tab) => tab.value === tabParam)
      ?.value ?? COMPLAINT_STATUS.OPEN
  );
}
