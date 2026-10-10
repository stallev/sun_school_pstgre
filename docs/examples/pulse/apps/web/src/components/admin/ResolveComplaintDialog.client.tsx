"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  COMPLAINT_RESOLUTION,
  complaintResolutionRequiresNotes,
  type ComplaintResolution,
} from "@pulse/domain";

import { closeComplaintAction } from "@/actions/admin/manage-complaint";
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
import { Button, type ButtonProps } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getComplaintResolutionOptions } from "@/lib/admin/complaint-resolution-options";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";
import { cn } from "@/lib/utils";

export type ResolveComplaintDialogProps = {
  complaintId: string;
  mode?: "finish" | "quick";
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
  className?: string;
  disabled?: boolean;
};

export function ResolveComplaintDialog({  complaintId,
  mode = "finish",
  triggerVariant = mode === "finish" ? "default" : "outline",
  triggerSize = "sm",
  className,
  disabled = false,
}: ResolveComplaintDialogProps) {
  const messages = useMessages();

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [resolution, setResolution] = useState<ComplaintResolution | "">("");
  const [adminNotes, setAdminNotes] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isQuick = mode === "quick";
  const triggerLabel = isQuick
    ? messages.admin.complaints.quickClose
    : messages.admin.complaints.finishReview;
  const pendingLabel = isQuick
    ? messages.admin.complaints.closing
    : messages.admin.complaints.finishingReview;
  const title = isQuick
    ? messages.admin.complaints.quickCloseTitle
    : messages.admin.complaints.resolveTitle;
  const description = isQuick
    ? messages.admin.complaints.quickCloseDescription
    : messages.admin.complaints.resolveDescription;
  const resolutionOptions = getComplaintResolutionOptions(messages);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setResolution("");
      setAdminNotes("");
      setFieldError(null);
    }
  }

  function handleConfirm() {
    if (!resolution) {
      setFieldError(messages.admin.complaints.resolutionPlaceholder);
      return;
    }

    if (
      complaintResolutionRequiresNotes(resolution) &&
      adminNotes.trim().length < 10
    ) {
      setFieldError(messages.admin.complaints.notesRequired);
      return;
    }

    setFieldError(null);

    startTransition(async () => {
      const result = await closeComplaintAction({
        complaintId,
        resolution,
        adminNotes: adminNotes.trim() || undefined,
      });

      if (!result.ok) {
        toast.error(result.message, { duration: PRODUCT_TOAST_DURATION_MS });
        router.refresh();
        return;
      }

      toast.success(messages.admin.complaints.closeSuccess, {
        duration: PRODUCT_TOAST_DURATION_MS,
      });
      handleOpenChange(false);
      router.refresh();
    });
  }

  const showRefundHint =
    resolution === COMPLAINT_RESOLUTION.REFUND_RECOMMENDED;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant={triggerVariant}
          size={triggerSize}
          className={cn("min-h-11", className)}
          disabled={disabled || isPending}
          aria-busy={isPending}
        >
          {isPending ? pendingLabel : triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="complaint-resolution">
              {messages.admin.complaints.resolutionLabel}
            </Label>
            <Select
              value={resolution}
              onValueChange={(value) =>
                setResolution(value as ComplaintResolution)
              }
            >
              <SelectTrigger
                id="complaint-resolution"
                className="w-full max-w-[650px]"
                aria-invalid={fieldError && !resolution ? true : undefined}
              >
                <SelectValue
                  placeholder={messages.admin.complaints.resolutionPlaceholder}
                />
              </SelectTrigger>
              <SelectContent>
                {resolutionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="complaint-admin-notes">
              {messages.admin.complaints.notesLabel}
            </Label>
            <Textarea
              id="complaint-admin-notes"
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              className="max-w-[650px]"
              rows={4}
              placeholder={messages.admin.complaints.notesPlaceholder}
              aria-invalid={fieldError ? true : undefined}
            />
          </div>

          {showRefundHint ? (
            <p className="text-sm text-muted-foreground">
              {messages.admin.complaints.refundRecommendedHint}
            </p>
          ) : null}

          {fieldError ? (
            <p className="text-sm text-destructive" role="alert">
              {fieldError}
            </p>
          ) : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {messages.shell.back}
          </AlertDialogCancel>
          <Button
            type="button"
            variant={isQuick ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? pendingLabel : triggerLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
