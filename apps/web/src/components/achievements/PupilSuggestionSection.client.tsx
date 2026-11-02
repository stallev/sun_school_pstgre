"use client";

import { useState } from "react";
import { ConfirmSuggestionDialog } from "@/components/achievements/ConfirmSuggestionDialog.client";
import { PupilSuggestionList } from "@/components/achievements/PupilSuggestionList";
import type { PupilSuggestionRow } from "@/lib/achievements/pupil-achievement-panel-types";
import type { Dictionary, MessageLocale } from "@/lib/messages/dictionary-types";
import type { TeacherSuggestionMessages } from "@/lib/messages/teacher-suggestion-messages";

type PupilSuggestionSectionProps = {
  pupilName: string;
  suggestions: PupilSuggestionRow[];
  messages: TeacherSuggestionMessages;
  formatTier: (tier: number) => string;
  locale: MessageLocale;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

/** Pending-suggestions block plus its confirmation modal (screens spec 5.8). */
export const PupilSuggestionSection = ({
  pupilName,
  suggestions,
  messages,
  formatTier,
  locale,
  dictionaries,
  formError,
}: PupilSuggestionSectionProps) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const active = suggestions.find((row) => row.suggestionId === openId) ?? null;

  return (
    <>
      <PupilSuggestionList
        suggestions={suggestions}
        messages={messages}
        formatTier={formatTier}
        onOpen={(row) => setOpenId(row.suggestionId)}
      />
      {active ? (
        <ConfirmSuggestionDialog
          open
          onOpenChange={(open) => {
            if (!open) setOpenId(null);
          }}
          suggestion={active}
          pupilName={pupilName}
          tierLabel={formatTier(active.tier)}
          locale={locale}
          messages={messages}
          dictionaries={dictionaries}
          formError={formError}
        />
      ) : null}
    </>
  );
};
