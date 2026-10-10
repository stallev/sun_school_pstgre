import { CheckCircleIcon } from "lucide-react";

import { AdminQueueEmptyState } from "@/components/admin/AdminQueueEmptyState";
import { ReviewModerationCard } from "@/components/admin/ReviewModerationCard";
import type { ReviewModerationItem } from "@/data/admin/list-reviews-for-moderation.server";
import { getMessages } from "@/lib/messages/server";


export type ReviewsListProps = {
  reviews: ReviewModerationItem[];
  emptyMessage: string;
};

export async function ReviewsList({ reviews, emptyMessage }: ReviewsListProps) {
  const messages = await getMessages();
  if (reviews.length === 0) {
    return (
      <AdminQueueEmptyState
        icon={CheckCircleIcon}
        variant="neutral"
        title={emptyMessage}
        description={messages.admin.shared.allClearDescription}
        className="md:col-span-2"
      />
    );
  }

  return (
    <ul className="mt-6 grid grid-cols-1 items-stretch gap-2.5 md:grid-cols-2">
      {reviews.map((review) => (
        <li key={review.id} className="h-full min-w-0">
          <ReviewModerationCard review={review} />
        </li>
      ))}
    </ul>
  );
}
