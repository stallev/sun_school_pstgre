"use client";

import { PupilSuggestionList } from "@/components/achievements/PupilSuggestionList";
import { SuggestionVerseList } from "@/components/achievements/SuggestionVerseList";
import { Card } from "@/components/ui/card";
import type { PupilSuggestionRow, SuggestionVerseView } from "@/lib/achievements/pupil-achievement-panel-types";
import type { TeacherSuggestionMessages } from "@/lib/messages/teacher-suggestion-messages";

const SAMPLE_VERSES: SuggestionVerseView[] = [
  { reference: "Ин 3:16", text: "Ибо так возлюбил Бог мир, что отдал Сына Своего Единородного.", dateLabel: "5 окт" },
  { reference: "Пс 22:1", text: "Господь — Пастырь мой; я ни в чём не буду нуждаться.", dateLabel: "12 окт" },
  { reference: "Быт 1:1", text: null, dateLabel: "19 окт" },
];

const SAMPLE_ROWS: PupilSuggestionRow[] = [
  { suggestionId: "s1", achievementName: "Хранитель слова", tier: 1, seriesLength: 3, deferredDateLabel: null, verses: SAMPLE_VERSES, canAct: true },
  { suggestionId: "s2", achievementName: "Хранитель слова", tier: 2, seriesLength: 5, deferredDateLabel: "20 октября", verses: [], canAct: false },
];


type SuggestionConfirmLabViewProps = { messages: TeacherSuggestionMessages };

/** Client part of the Design Lab section: the list takes an `onOpen` handler, which a server page cannot pass. */
export const SuggestionConfirmLabView = ({ messages }: SuggestionConfirmLabViewProps) => (
  <div className="grid gap-4">
    <PupilSuggestionList
      suggestions={SAMPLE_ROWS}
      messages={messages}
      formatTier={(tier) => `Ур. ${tier}`}
      onOpen={() => undefined}
    />
    <Card className="p-3">
      <SuggestionVerseList verses={SAMPLE_VERSES} emptyLabel={messages.versesEmpty} textMissingLabel={messages.textMissing} />
    </Card>
    <Card className="p-3">
      <SuggestionVerseList verses={[]} emptyLabel={messages.versesEmpty} textMissingLabel={messages.textMissing} />
    </Card>
  </div>
);
