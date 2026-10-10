"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import type { MutationResult } from "@pulse/domain";

import { approveTrainerAction } from "@/actions/admin/approve-trainer";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import {
  setSubmitTransportTag,
  SUBMIT_TRANSPORT_TAGS,
} from "@/lib/sentry/pulse-tags";
import { isIosSafari } from "@/lib/ui/is-ios-safari";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";
import { resilientPostFetch } from "@/lib/ui/resilient-post-fetch";

export type ApproveTrainerButtonProps = {
  trainerProfileId: string;
};

export function ApproveTrainerButton({  trainerProfileId,
}: ApproveTrainerButtonProps) {
  const messages = useMessages();

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      const payload = { trainerProfileId };

      try {
        let result: MutationResult<{ trainerProfileId: string }>;

        if (isIosSafari()) {
          setSubmitTransportTag(SUBMIT_TRANSPORT_TAGS.ROUTE_HANDLER_FALLBACK);
          result = await resilientPostFetch("/api/admin/trainers/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }).then((response) => response.json());
        } else {
          setSubmitTransportTag(SUBMIT_TRANSPORT_TAGS.SERVER_ACTION);
          result = await approveTrainerAction(payload);
        }

        if (!result.ok) {
          toast.error(result.message, { duration: PRODUCT_TOAST_DURATION_MS });
          router.refresh();
          return;
        }

        toast.success(messages.admin.moderation.approveSuccess, {
          duration: PRODUCT_TOAST_DURATION_MS,
        });
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
    <Button
      type="button"
      onClick={handleApprove}
      disabled={isPending}
      aria-busy={isPending}
    >
      {isPending
        ? messages.admin.moderation.approving
        : messages.admin.moderation.approve}
    </Button>
  );
}
