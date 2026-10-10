import { Suspense } from "react";

import { TRAINER_STATUS } from "@pulse/domain";

import { AdminPillTabs } from "@/components/admin/AdminPillTabs.client";
import { AdminPillTabsListSkeleton } from "@/components/admin/AdminPillTabsListSkeleton";
import { AdminTrainersCounts } from "@/components/admin/AdminTrainersCounts.server";
import { TrainerApplicationsGridSkeleton } from "@/components/admin/TrainerApplicationsGridSkeleton";
import { TrainerApplicationsTabPanel } from "@/components/admin/TrainerApplicationsTabPanel.server";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  getTrainerModerationTabs,
  resolveTrainerModerationTab,
} from "@/lib/admin/trainer-moderation-tabs";
import { getMessages } from "@/lib/messages/server";

type AdminTrainersPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminTrainersPage({
  searchParams,
}: AdminTrainersPageProps) {
  const messages = await getMessages();
  const params = await searchParams;
  const activeTab = resolveTrainerModerationTab(params.tab, messages);
  const tabs = getTrainerModerationTabs(messages).map((tab) => ({
    value: tab.value,
    label: tab.label,
  }));
  const ariaLabel = messages.admin.moderation.tabsAriaLabel;

  return (
    <>
      <PageHeader title={messages.admin.moderation.title} />

      <AdminPillTabs
        activeTab={activeTab}
        basePath="/admin/trainers"
        defaultTab={TRAINER_STATUS.PENDING}
        tabsList={
          <Suspense
            fallback={
              <AdminPillTabsListSkeleton tabs={tabs} ariaLabel={ariaLabel} />
            }
          >
            <AdminTrainersCounts tabs={tabs} ariaLabel={ariaLabel} />
          </Suspense>
        }
      >
        <Suspense fallback={<TrainerApplicationsGridSkeleton />}>
          <TrainerApplicationsTabPanel status={activeTab} />
        </Suspense>
      </AdminPillTabs>
    </>
  );
}
