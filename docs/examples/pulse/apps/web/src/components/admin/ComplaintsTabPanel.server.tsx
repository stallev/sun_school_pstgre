import type { ComplaintStatus } from "@pulse/domain";

import { ComplaintsList } from "@/components/admin/ComplaintsList";
import { listComplaintsWithAssignees } from "@/data/admin/list-complaints.server";
import { getComplaintModerationTabs } from "@/lib/admin/complaint-moderation-tabs";
import { getMessages } from "@/lib/messages/server";

export type ComplaintsTabPanelProps = {
  status: ComplaintStatus;
};

export async function ComplaintsTabPanel({ status }: ComplaintsTabPanelProps) {
  const messages = await getMessages();
  const items = await listComplaintsWithAssignees(status);
  const tabConfig = getComplaintModerationTabs(messages).find(
    (tab) => tab.value === status,
  );

  return (
    <ComplaintsList
      items={items}
      emptyMessage={tabConfig?.emptyMessage ?? ""}
    />
  );
}
