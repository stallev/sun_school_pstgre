"use client";

import { XIcon } from "lucide-react";
import { ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import type { LessonFormVerseRow } from "@/data/lessons/load-lesson-form-page.server";
import { formatVerseRefLabel } from "@/lib/lesson/format-verse-ref";
import type { TeacherLessonFormMessages } from "@/lib/messages/teacher-lesson-messages";
import { fillMessage } from "@/lib/messages/fill-message";
import type { BibleBookListItem } from "@/data/bible/list-books";

type VerseRefListProps = {
  verses: LessonFormVerseRow[];
  books: readonly BibleBookListItem[];
  messages: TeacherLessonFormMessages;
  onRemove: (index: number) => void;
  disabled?: boolean;
};

export const VerseRefList = ({ verses, books, messages, onRemove, disabled }: VerseRefListProps) => {
  if (verses.length === 0) {
    return <ContentText className="text-sm text-muted">{messages.versesEmpty}</ContentText>;
  }

  return (
    <ol className="space-y-2">
      {verses.map((verse, index) => {
        const book = books.find((row) => row.id === verse.bookId);
        const refLabel = book
          ? formatVerseRefLabel(book, messages.locale, verse)
          : String(index + 1);
        return (
          <li
            key={`${verse.bookId}-${verse.startChapter}-${verse.startVerse}-${index}`}
            className="flex items-start gap-3 rounded-lg border border-line px-3 py-2.5"
          >
            <span className="font-display text-muted tabular-nums">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">{refLabel}</p>
              <p className="line-clamp-3 text-sm text-ink-2">
                {verse.hasMissing
                  ? fillMessage(messages.missingVerseItem, { ref: refLabel })
                  : verse.text ?? messages.pickerHint}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0"
              disabled={disabled}
              aria-label={fillMessage(messages.versesRemove, { ref: refLabel })}
              onClick={() => onRemove(index)}
            >
              <XIcon className="size-4" aria-hidden />
            </Button>
          </li>
        );
      })}
    </ol>
  );
};
