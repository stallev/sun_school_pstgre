"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import {
  confirmAchievementSuggestionAction,
  deferAchievementSuggestionAction,
} from "@/actions/teacher-achievements";
import { ContentText } from "@/components/atoms/ContentText";
import { DismissSuggestionDialog } from "@/components/achievements/DismissSuggestionDialog.client";
import { SuggestionVerseList } from "@/components/achievements/SuggestionVerseList";
import { useSuggestionAction } from "@/components/achievements/use-suggestion-action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PupilSuggestionRow } from "@/lib/achievements/pupil-achievement-panel-types";
import type { Dictionary, MessageLocale } from "@/lib/messages/dictionary-types";
import { formatPlural } from "@/lib/messages/plural";
import type { TeacherSuggestionMessages } from "@/lib/messages/teacher-suggestion-messages";

type ConfirmSuggestionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestion: PupilSuggestionRow;
  pupilName: string;
  tierLabel: string;
  locale: MessageLocale;
  messages: TeacherSuggestionMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const ConfirmSuggestionDialog = ({
  open,
  onOpenChange,
  suggestion,
  pupilName,
  tierLabel,
  locale,
  messages,
  dictionaries,
  formError,
}: ConfirmSuggestionDialogProps) => {
  const [dismissOpen, setDismissOpen] = useState(false);
  const { pending, activeKind, run } = useSuggestionAction({
    dictionaries,
    formErrorFallback: formError,
    onDone: () => onOpenChange(false),
  });
  const { suggestionId } = suggestion;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={messages.closeLabel}>
        <DialogHeader>
          <DialogTitle>{messages.dialogTitle}</DialogTitle>
          <ContentText className="text-sm text-ink-2">
            {`${pupilName} · ${suggestion.achievementName} · ${tierLabel}`}
          </ContentText>
        </DialogHeader>
        <ContentText>{formatPlural(messages.introForms, suggestion.seriesLength, locale)}</ContentText>
        <div className="grid gap-1">
          <ContentText className="text-sm font-medium text-ink">{messages.versesTitle}</ContentText>
          <SuggestionVerseList
            verses={suggestion.verses}
            emptyLabel={messages.versesEmpty}
            textMissingLabel={messages.textMissing}
            className="max-h-[40vh] overflow-y-auto"
          />
        </div>
        <DialogFooter aria-busy={pending}>
          <Button type="button" variant="destructive" disabled={pending} onClick={() => setDismissOpen(true)}>
            {messages.dismiss}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            aria-busy={activeKind === "defer"}
            onClick={() =>
              run("defer", () => deferAchievementSuggestionAction(suggestionId), messages.toastDeferred)
            }
          >
            {activeKind === "defer" ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
            {activeKind === "defer" ? messages.deferring : messages.defer}
          </Button>
          <Button
            type="button"
            disabled={pending}
            aria-busy={activeKind === "confirm"}
            onClick={() =>
              run("confirm", () => confirmAchievementSuggestionAction(suggestionId), messages.toastConfirmed)
            }
          >
            {activeKind === "confirm" ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
            {activeKind === "confirm" ? messages.confirming : messages.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
      {dismissOpen ? (
        <DismissSuggestionDialog
          open
          onOpenChange={setDismissOpen}
          suggestionId={suggestionId}
          messages={messages}
          dictionaries={dictionaries}
          formError={formError}
          onDismissed={() => onOpenChange(false)}
        />
      ) : null}
    </Dialog>
  );
};
