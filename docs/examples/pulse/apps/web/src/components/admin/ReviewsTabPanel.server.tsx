import { ReviewsList } from "@/components/admin/ReviewsList";
import { listReviewsForModeration } from "@/data/admin/list-reviews-for-moderation.server";
import {
  getReviewModerationTabs,
  type ReviewModerationTab,
} from "@/lib/admin/review-moderation-tabs";
import { getMessages } from "@/lib/messages/server";

export type ReviewsTabPanelProps = {
  tab: ReviewModerationTab;
};

export async function ReviewsTabPanel({ tab }: ReviewsTabPanelProps) {
  const messages = await getMessages();
  const tabConfig = getReviewModerationTabs(messages).find(
    (entry) => entry.value === tab,
  );
  const reviews = await listReviewsForModeration({
    isHidden: tabConfig?.isHidden ?? false,
  });

  return (
    <ReviewsList
      reviews={reviews}
      emptyMessage={tabConfig?.emptyMessage ?? messages.admin.reviews.empty}
    />
  );
}
