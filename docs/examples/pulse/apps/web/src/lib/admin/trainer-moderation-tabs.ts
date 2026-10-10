import { TRAINER_STATUS, type TrainerStatus } from "@pulse/domain";

import type { Messages } from "@/lib/messages/types";

export type TrainerModerationTabConfig = {
  value: TrainerStatus;
  label: string;
  emptyMessage: string;
};

export function getTrainerModerationTabs(
  messages: Messages,
): TrainerModerationTabConfig[] {
  return [
    {
      value: TRAINER_STATUS.PENDING,
      label: messages.admin.moderation.tabs.pending,
      emptyMessage: messages.admin.moderation.emptyPending,
    },
    {
      value: TRAINER_STATUS.APPROVED,
      label: messages.admin.moderation.tabs.approved,
      emptyMessage: messages.admin.moderation.emptyApproved,
    },
    {
      value: TRAINER_STATUS.REJECTED,
      label: messages.admin.moderation.tabs.rejected,
      emptyMessage: messages.admin.moderation.emptyRejected,
    },
  ];
}

export function resolveTrainerModerationTab(
  tabParam: string | undefined,
  messages: Messages,
): TrainerStatus {
  return (
    getTrainerModerationTabs(messages).find((tab) => tab.value === tabParam)
      ?.value ?? TRAINER_STATUS.PENDING
  );
}

export { formatModerationTabLabel } from "@/lib/admin/format-tab-label";
