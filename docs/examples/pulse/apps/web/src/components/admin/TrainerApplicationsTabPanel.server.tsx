import type { TrainerStatus } from "@pulse/domain";

import { TrainerApplicationsList } from "@/components/admin/TrainerApplicationsList";
import { listTrainerApplications } from "@/data/admin/list-trainer-applications.server";
import { getTrainerModerationTabs } from "@/lib/admin/trainer-moderation-tabs";
import { getMessages } from "@/lib/messages/server";

export type TrainerApplicationsTabPanelProps = {
  status: TrainerStatus;
};

export async function TrainerApplicationsTabPanel({
  status,
}: TrainerApplicationsTabPanelProps) {
  const messages = await getMessages();
  const items = await listTrainerApplications(status);
  const tabConfig = getTrainerModerationTabs(messages).find(
    (tab) => tab.value === status,
  );

  return (
    <TrainerApplicationsList
      items={items}
      emptyMessage={tabConfig?.emptyMessage ?? ""}
      status={status}
    />
  );
}
