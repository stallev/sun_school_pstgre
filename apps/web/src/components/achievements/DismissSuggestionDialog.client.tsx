"use client";

import type { FormEvent } from "react";
import { Loader2Icon } from "lucide-react";
import { dismissAchievementSuggestionAction } from "@/actions/teacher-achievements";
import { useSuggestionAction } from "@/components/achievements/use-suggestion-action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Dictionary } from "@/lib/messages/dictionary-types";
import type { TeacherSuggestionMessages } from "@/lib/messages/teacher-suggestion-messages";

/** Mirrors the server-side limit (suggestions contract section 7). */
const DISMISS_REASON_MAX_LENGTH = 500;

type DismissSuggestionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestionId: string;
  messages: TeacherSuggestionMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  onDismissed: () => void;
};

export const DismissSuggestionDialog = ({
  open,
  onOpenChange,
  suggestionId,
  messages,
  dictionaries,
  formError,
  onDismissed,
}: DismissSuggestionDialogProps) => {
  const { pending, run } = useSuggestionAction({
    dictionaries,
    formErrorFallback: formError,
    onDone: () => {
      onOpenChange(false);
      onDismissed();
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reason = String(new FormData(event.currentTarget).get("reason") ?? "").trim();
    run(
      "dismiss",
      () => dismissAchievementSuggestionAction(suggestionId, reason || undefined),
      messages.toastDismissed,
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={messages.closeLabel}>
        <DialogHeader>
          <DialogTitle>{messages.dismissTitle}</DialogTitle>
          <DialogDescription>{messages.dismissDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4" aria-busy={pending}>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-ink">{messages.dismissReasonLabel}</span>
            <Textarea
              name="reason"
              maxLength={DISMISS_REASON_MAX_LENGTH}
              disabled={pending}
              placeholder={messages.dismissReasonPlaceholder}
              className="max-w-none"
            />
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
              {messages.cancel}
            </Button>
            <Button type="submit" variant="destructive" disabled={pending} aria-busy={pending}>
              {pending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
              {pending ? messages.dismissing : messages.dismiss}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
