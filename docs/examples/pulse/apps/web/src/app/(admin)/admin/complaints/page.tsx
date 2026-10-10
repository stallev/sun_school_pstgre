import { Suspense } from "react";

import { COMPLAINT_STATUS } from "@pulse/domain";

import { AdminComplaintsCounts } from "@/components/admin/AdminComplaintsCounts.server";
import { AdminPillTabs } from "@/components/admin/AdminPillTabs.client";
import { AdminPillTabsListSkeleton } from "@/components/admin/AdminPillTabsListSkeleton";
import { AdminQueueGridSkeleton } from "@/components/admin/AdminQueueGridSkeleton";
import { ComplaintsTabPanel } from "@/components/admin/ComplaintsTabPanel.server";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  getComplaintModerationTabs,
  resolveComplaintTab,
} from "@/lib/admin/complaint-moderation-tabs";
import { getMessages } from "@/lib/messages/server";

type AdminComplaintsPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminComplaintsPage({
  searchParams,
}: AdminComplaintsPageProps) {
  const messages = await getMessages();
  const params = await searchParams;
  const activeTab = resolveComplaintTab(params.tab, messages);
  const tabs = getComplaintModerationTabs(messages).map((tab) => ({
    value: tab.value,
    label: tab.label,
  }));
  const ariaLabel = messages.admin.complaints.tabsAriaLabel;

  return (
    <>
      <PageHeader title={messages.admin.complaints.title} />

      <AdminPillTabs
        activeTab={activeTab}
        basePath="/admin/complaints"
        defaultTab={COMPLAINT_STATUS.OPEN}
        tabsList={
          <Suspense
            fallback={
              <AdminPillTabsListSkeleton tabs={tabs} ariaLabel={ariaLabel} />
            }
          >
            <AdminComplaintsCounts tabs={tabs} ariaLabel={ariaLabel} />
          </Suspense>
        }
      >
        <Suspense fallback={<AdminQueueGridSkeleton count={4} />}>
          <ComplaintsTabPanel status={activeTab} />
        </Suspense>
      </AdminPillTabs>
    </>
  );
}
