"use client";

import { ContentText } from "@/components/atoms";
import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import type { AchievementsCatalogMessages } from "@/lib/messages/pick-achievements-catalog-messages.server";
import type { GlossaryTerm } from "@/lib/messages/pick-glossary-messages";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";

type AchievementsRulesNoteProps = {
  messages: AchievementsCatalogMessages;
  seriesHint: HintTerm;
  reviewLesson: GlossaryTerm;
  termHintAriaLabel: string;
};

export const AchievementsRulesNote = ({
  messages,
  seriesHint,
  reviewLesson,
  termHintAriaLabel,
}: AchievementsRulesNoteProps) => (
  <ContentText tone="secondary" className="mb-6 max-w-3xl text-sm">
    <TermLabel
      term={nonEmptyTerm(seriesHint.term)}
      hint={seriesHint.hint}
      ariaLabel={termHintAriaLabel}
    />{" "}
    {messages.rulesNoteSeriesLead}{" "}
    <TermLabel
      term={nonEmptyTerm(messages.rulesNoteOverviewTerm)}
      hint={reviewLesson.hint}
      ariaLabel={termHintAriaLabel}
    />{" "}
    {messages.rulesNoteOverviewInSeries} {messages.rulesNoteTail}
  </ContentText>
);
