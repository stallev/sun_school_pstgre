import {
  AdminPillTabsList,
  type AdminPillTabsListItem,
} from "@/components/admin/AdminPillTabsList";
import { getReviewModerationCounts } from "@/data/admin/list-reviews-for-moderation.server";
import {
  REVIEW_TAB_HIDDEN,
  REVIEW_TAB_VISIBLE,
} from "@/lib/admin/review-moderation-tabs";

export type AdminReviewsCountsProps = {
  tabs: AdminPillTabsListItem[];
  ariaLabel: string;
};

export async function AdminReviewsCounts({
  tabs,
  ariaLabel,
}: AdminReviewsCountsProps) {
  const countsData = await getReviewModerationCounts();
  const counts: Record<string, number> = {
    [REVIEW_TAB_VISIBLE]: countsData.visible,
    [REVIEW_TAB_HIDDEN]: countsData.hidden,
  };

  return (
    <AdminPillTabsList tabs={tabs} counts={counts} ariaLabel={ariaLabel} />
  );
}
