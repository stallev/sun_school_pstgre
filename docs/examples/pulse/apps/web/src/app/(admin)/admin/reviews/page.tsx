import { Suspense } from "react";

import { AdminPillTabs } from "@/components/admin/AdminPillTabs.client";
import { AdminPillTabsListSkeleton } from "@/components/admin/AdminPillTabsListSkeleton";
import { AdminQueueGridSkeleton } from "@/components/admin/AdminQueueGridSkeleton";
import { AdminReviewsCounts } from "@/components/admin/AdminReviewsCounts.server";
import { ReviewsTabPanel } from "@/components/admin/ReviewsTabPanel.server";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  getReviewModerationTabs,
  resolveReviewTab,
  REVIEW_TAB_VISIBLE,
} from "@/lib/admin/review-moderation-tabs";
import { getMessages } from "@/lib/messages/server";

type AdminReviewsPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminReviewsPage({
  searchParams,
}: AdminReviewsPageProps) {
  const messages = await getMessages();
  const params = await searchParams;
  const activeTab = resolveReviewTab(params.tab);
  const tabs = getReviewModerationTabs(messages).map((tab) => ({
    value: tab.value,
    label: tab.label,
  }));
  const ariaLabel = messages.admin.reviews.tabsAriaLabel;

  return (
    <>
      <PageHeader title={messages.admin.reviews.title} />

      <AdminPillTabs
        activeTab={activeTab}
        basePath="/admin/reviews"
        defaultTab={REVIEW_TAB_VISIBLE}
        tabsList={
          <Suspense
            fallback={
              <AdminPillTabsListSkeleton tabs={tabs} ariaLabel={ariaLabel} />
            }
          >
            <AdminReviewsCounts tabs={tabs} ariaLabel={ariaLabel} />
          </Suspense>
        }
      >
        <Suspense fallback={<AdminQueueGridSkeleton count={4} />}>
          <ReviewsTabPanel tab={activeTab} />
        </Suspense>
      </AdminPillTabs>
    </>
  );
}
