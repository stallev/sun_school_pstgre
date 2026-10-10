"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { MutationResult } from "@pulse/domain";

import { rejectTrainerAction } from "@/actions/admin/reject-trainer";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import {
  setSubmitTransportTag,
  SUBMIT_TRANSPORT_TAGS,
} from "@/lib/sentry/pulse-tags";
import { isIosSafari } from "@/lib/ui/is-ios-safari";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";
import { resilientPostFetch } from "@/lib/ui/resilient-post-fetch";

export type RejectTrainerDialogProps = {
  trainerProfileId: string;
};

export function RejectTrainerDialog({ trainerProfileId }: RejectTrainerDialogProps) {
  const messages = useMessages();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleReject() {
    if (reason.trim().length < 10) {
      setFieldError(messages.admin.moderation.rejectionReasonRequired);
      return;
    }

    setFieldError(null);

    startTransition(async () => {
      const payload = { trainerProfileId, rejectionReason: reason.trim() };

      try {
        let result: MutationResult<{ trainerProfileId: string }>;

        if (isIosSafari()) {
          setSubmitTransportTag(SUBMIT_TRANSPORT_TAGS.ROUTE_HANDLER_FALLBACK);
          result = await resilientPostFetch("/api/admin/trainers/reject", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }).then((response) => response.json());
        } else {
          setSubmitTransportTag(SUBMIT_TRANSPORT_TAGS.SERVER_ACTION);
          result = await rejectTrainerAction(payload);
        }

        if (!result.ok) {
          toast.error(result.message, { duration: PRODUCT_TOAST_DURATION_MS });
          router.refresh();
          return;
        }

        toast.success(messages.admin.moderation.rejectSuccess, {
          duration: PRODUCT_TOAST_DURATION_MS,
        });
        setOpen(false);
        setReason("");
        router.refresh();
      } catch {
        toast.error(messages.admin.errors.generic, {
          duration: PRODUCT_TOAST_DURATION_MS,
        });
        router.refresh();
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" disabled={isPending} aria-busy={isPending}>
          {messages.admin.moderation.reject}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{messages.admin.moderation.reject}</AlertDialogTitle>
          <AlertDialogDescription>
            {messages.admin.moderation.rejectionReasonPlaceholder}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="rejection-reason">
            {messages.admin.moderation.rejectionReasonLabel}
          </Label>
          <Textarea
            id="rejection-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="max-w-[650px]"
            rows={4}
            aria-invalid={fieldError ? true : undefined}
          />
          {fieldError ? (
            <p className="text-sm text-destructive">{fieldError}</p>
          ) : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {messages.shell.back}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={handleReject}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending
              ? messages.admin.moderation.rejecting
              : messages.admin.moderation.reject}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
