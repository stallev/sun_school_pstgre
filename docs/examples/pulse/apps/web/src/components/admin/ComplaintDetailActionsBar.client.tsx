"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { COMPLAINT_STATUS } from "@pulse/domain";

import { startComplaintReviewAction } from "@/actions/admin/manage-complaint";
import { ResolveComplaintDialog } from "@/components/admin/ResolveComplaintDialog.client";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

export type ComplaintDetailActionsBarProps = {
  complaintId: string;
  status: string;
  canStartReview: boolean;
  canClose: boolean;
};

export function ComplaintDetailActionsBar({  complaintId,
  status,
  canStartReview,
  canClose,
}: ComplaintDetailActionsBarProps) {
  const messages = useMessages();

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isInReview = status === COMPLAINT_STATUS.IN_REVIEW;

  function handleStartReview() {
    startTransition(async () => {
      const result = await startComplaintReviewAction({ complaintId });
      if (!result.ok) {
        toast.error(result.message, { duration: PRODUCT_TOAST_DURATION_MS });
        router.refresh();
        return;
      }

      toast.success(messages.admin.complaints.startReviewSuccess, {
        duration: PRODUCT_TOAST_DURATION_MS,
      });
      router.refresh();
    });
  }

  if (!canStartReview && !canClose) {
    return null;
  }

  return (
    <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
      <div className="flex flex-wrap gap-2 [&_button]:min-h-11">
        {canStartReview ? (
          <Button
            type="button"
            onClick={handleStartReview}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending
              ? messages.admin.complaints.startingReview
              : messages.admin.complaints.startReview}
          </Button>
        ) : null}
        {canClose && isInReview ? (
          <ResolveComplaintDialog
            complaintId={complaintId}
            mode="finish"
            triggerVariant="default"
            triggerSize="default"
            disabled={isPending}
          />
        ) : null}
        {canClose && !isInReview ? (
          <ResolveComplaintDialog
            complaintId={complaintId}
            mode="quick"
            triggerVariant="outline"
            triggerSize="default"
            disabled={isPending}
          />
        ) : null}
      </div>
    </div>
  );
}
