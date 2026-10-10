"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { requestRefundAction } from "@/actions/client/request-refund";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

export type ClientRequestRefundDialogProps = {
  bookingId: string;
  maxAmountCents: number;
};

export function ClientRequestRefundDialog({  bookingId,
  maxAmountCents,
}: ClientRequestRefundDialogProps) {
  const messages = useMessages();

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amountCents, setAmountCents] = useState(String(maxAmountCents));
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await requestRefundAction({
        bookingId,
        amountCents: Number(amountCents),
        reason,
      });

      if (!result.ok) {
        toast.error(result.message, { duration: PRODUCT_TOAST_DURATION_MS });
        return;
      }

      toast.success(messages.clientComplaint.refundSuccess, {
        duration: PRODUCT_TOAST_DURATION_MS,
      });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 w-full"
          disabled={isPending}
          aria-busy={isPending}
        >
          {messages.clientComplaint.requestRefund}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.clientComplaint.requestRefund}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="refund-amount">{messages.clientComplaint.amountLabel}</Label>
            <Input
              id="refund-amount"
              type="number"
              min={1}
              max={maxAmountCents}
              value={amountCents}
              onChange={(event) => setAmountCents(event.target.value)}
              className="max-w-[300px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="refund-reason">{messages.clientComplaint.reasonLabel}</Label>
            <Textarea
              id="refund-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="max-w-[650px]"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending
              ? messages.clientComplaint.refundSubmitting
              : messages.clientComplaint.refundSubmit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
