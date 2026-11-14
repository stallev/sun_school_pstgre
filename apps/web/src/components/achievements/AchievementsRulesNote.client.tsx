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
  <section className="mb-6 flex max-w-3xl min-w-0 flex-col gap-hint" aria-label={messages.rulesNoteTitle}>
    <ContentText className="font-medium text-ink">{messages.rulesNoteTitle}</ContentText>
    <ul className="list-inside list-disc space-y-hint text-sm text-ink-2">
      <li>
        <TermLabel
          term={nonEmptyTerm(seriesHint.term)}
          hint={seriesHint.hint}
          ariaLabel={termHintAriaLabel}
        />{" "}
        {messages.rulesNoteSeriesLead}
      </li>
      <li>
        <TermLabel
          term={nonEmptyTerm(messages.rulesNoteOverviewTerm)}
          hint={reviewLesson.hint}
          ariaLabel={termHintAriaLabel}
        />{" "}
        {messages.rulesNoteOverviewInSeries}
      </li>
      <li>{messages.rulesNoteTail}</li>
    </ul>
  </section>
);
