"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cancelBookingAction } from "@/actions/client/cancel-booking";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { MutationResult } from "@pulse/domain";

import { useMessages } from "@/components/i18n/LocaleProvider.client";

import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

export type ClientBookingCancelDialogProps = {
  bookingId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ClientBookingCancelDialog({  bookingId,
  open,
  onOpenChange,
}: ClientBookingCancelDialogProps) {
  const messages = useMessages();

  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    MutationResult<{ id: string; status: string }> | null,
    FormData
  >(cancelBookingAction, null);
  const lastHandledState = useRef<typeof state>(null);

  useEffect(() => {
    if (!state || state === lastHandledState.current) {
      return;
    }

    lastHandledState.current = state;

    if (state.ok) {
      toast.success(messages.toast.cancelled, {
        duration: PRODUCT_TOAST_DURATION_MS,
      });
      onOpenChange(false);
      router.refresh();
      return;
    }

    toast.error(state.message, {
      duration: PRODUCT_TOAST_DURATION_MS,
    });
  }, [onOpenChange, router, state]);

  if (!bookingId) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{messages.booking.cancel.confirmTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {messages.booking.cancel.confirmDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction}>
          <input type="hidden" name="bookingId" value={bookingId} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={pending}>
              {messages.booking.cancel.confirmDismiss}
            </AlertDialogCancel>
            <Button
              type="submit"
              variant="destructive"
              disabled={pending}
              aria-busy={pending}
            >
              {pending
                ? messages.booking.cancel.pending
                : messages.booking.cancel.confirmAction}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
