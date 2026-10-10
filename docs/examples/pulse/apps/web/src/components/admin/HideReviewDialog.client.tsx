"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { hideReviewAction } from "@/actions/admin/moderate-review";
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
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

export type HideReviewDialogProps = {
  reviewId: string;
};

export function HideReviewDialog({ reviewId }: HideReviewDialogProps) {
  const messages = useMessages();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleHide() {
    startTransition(async () => {
      const result = await hideReviewAction({ reviewId });
      if (!result.ok) {
        toast.error(result.message, { duration: PRODUCT_TOAST_DURATION_MS });
        router.refresh();
        return;
      }

      toast.success(messages.admin.reviews.hideSuccess, {
        duration: PRODUCT_TOAST_DURATION_MS,
      });
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          disabled={isPending}
          aria-busy={isPending}
        >
          {messages.admin.reviews.hide}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{messages.admin.reviews.hide}</AlertDialogTitle>
          <AlertDialogDescription>
            {messages.admin.reviews.confirmHide}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {messages.shell.back}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="default"
            onClick={handleHide}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending
              ? messages.admin.reviews.hiding
              : messages.admin.reviews.hide}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
