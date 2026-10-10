"use client";

import { DeleteReviewDialog } from "@/components/admin/DeleteReviewDialog.client";
import { HideReviewDialog } from "@/components/admin/HideReviewDialog.client";

export type ReviewModerationActionsProps = {
  reviewId: string;
  isHidden: boolean;
};

export function ReviewModerationActions({
  reviewId,
  isHidden,
}: ReviewModerationActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {!isHidden ? <HideReviewDialog reviewId={reviewId} /> : null}
      <DeleteReviewDialog reviewId={reviewId} />
    </div>
  );
}
