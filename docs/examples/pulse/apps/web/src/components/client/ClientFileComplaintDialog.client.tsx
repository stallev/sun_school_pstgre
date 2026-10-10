"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { fileComplaintAction } from "@/actions/client/file-complaint";
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

export type ClientFileComplaintDialogProps = {
  bookingId: string;
};

export function ClientFileComplaintDialog({  bookingId,
}: ClientFileComplaintDialogProps) {
  const messages = useMessages();

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await fileComplaintAction({
        bookingId,
        category,
        description,
      });

      if (!result.ok) {
        toast.error(result.message, { duration: PRODUCT_TOAST_DURATION_MS });
        return;
      }

      toast.success(messages.clientComplaint.success, {
        duration: PRODUCT_TOAST_DURATION_MS,
      });
      setOpen(false);
      setCategory("");
      setDescription("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full"
          disabled={isPending}
          aria-busy={isPending}
        >
          {messages.clientComplaint.reportIssue}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.clientComplaint.reportIssue}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="complaint-category">
              {messages.clientComplaint.categoryLabel}
            </Label>
            <Input
              id="complaint-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder={messages.clientComplaint.categoryPlaceholder}
              className="max-w-[300px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="complaint-description">
              {messages.clientComplaint.descriptionLabel}
            </Label>
            <Textarea
              id="complaint-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={messages.clientComplaint.descriptionPlaceholder}
              className="max-w-[650px]"
              rows={4}
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
              ? messages.clientComplaint.submitting
              : messages.clientComplaint.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
