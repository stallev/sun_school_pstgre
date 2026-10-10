"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { approveRefundAction, rejectRefundAction } from "@/actions/admin/process-refund";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

export type RefundActionsProps = {
  refundRequestId: string;
};

export function RefundActions({ refundRequestId }: RefundActionsProps) {
  const messages = useMessages();
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      const result = await approveRefundAction({ refundRequestId });
      if (!result.ok) {
        toast.error(result.message, { duration: PRODUCT_TOAST_DURATION_MS });
        router.refresh();
        return;
      }

      toast.success(messages.admin.refunds.approveSuccess, {
        duration: PRODUCT_TOAST_DURATION_MS,
      });
      router.refresh();
    });
  }

  function handleReject() {
    if (comment.trim().length < 10) {
      setFieldError(messages.admin.refunds.adminCommentRequired);
      return;
    }

    setFieldError(null);

    startTransition(async () => {
      const result = await rejectRefundAction({
        refundRequestId,
        adminComment: comment.trim(),
      });

      if (!result.ok) {
        toast.error(result.message, { duration: PRODUCT_TOAST_DURATION_MS });
        router.refresh();
        return;
      }

      toast.success(messages.admin.refunds.rejectSuccess, {
        duration: PRODUCT_TOAST_DURATION_MS,
      });
      setRejectOpen(false);
      setComment("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        onClick={handleApprove}
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? messages.admin.refunds.approving : messages.admin.refunds.approve}
      </Button>

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="outline" disabled={isPending} aria-busy={isPending}>
            {messages.admin.refunds.reject}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{messages.admin.refunds.reject}</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="refund-comment">{messages.admin.refunds.adminCommentLabel}</Label>
            <Textarea
              id="refund-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="max-w-[650px]"
              rows={3}
              aria-invalid={fieldError ? true : undefined}
            />
            {fieldError ? (
              <p className="text-sm text-destructive">{fieldError}</p>
            ) : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{messages.shell.back}</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending
                ? messages.admin.refunds.rejecting
                : messages.admin.refunds.reject}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
