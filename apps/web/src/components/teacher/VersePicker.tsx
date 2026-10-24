"use client";

import { APP_LOCALE } from "@sunschool/domain";
import { useState, useTransition } from "react";
import { PlusIcon } from "lucide-react";
import { previewLessonVerseAction } from "@/actions/lesson-verse-preview";
import { AlertText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import type { BibleBookListItem } from "@/data/bible/list-books";
import type { LessonFormVerseRow } from "@/data/lessons/load-lesson-form-page.server";
import type { TeacherLessonFormMessages } from "@/lib/messages/teacher-lesson-messages";

type VersePickerProps = {
  gradeId: string;
  books: readonly BibleBookListItem[];
  messages: TeacherLessonFormMessages;
  maxVerses: number;
  currentCount: number;
  disabled?: boolean;
  onAdd: (verse: LessonFormVerseRow) => void;
};

export const VersePicker = ({
  gradeId,
  books,
  messages,
  maxVerses,
  currentCount,
  disabled,
  onAdd,
}: VersePickerProps) => {
  const [bookId, setBookId] = useState(books[0]?.id ?? "");
  const [chapter, setChapter] = useState("");
  const [fromVerse, setFromVerse] = useState("");
  const [toVerse, setToVerse] = useState("");
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (currentCount >= maxVerses) {
    return <p className="text-sm text-muted">{messages.pickerAtLimit}</p>;
  }

  const handleAdd = () => {
    setPickerError(null);
    const startChapter = Number(chapter);
    const startVerse = Number(fromVerse);
    const endVerse = toVerse.trim() ? Number(toVerse) : startVerse;
    if (!bookId || !startChapter || !startVerse) {
      setPickerError(messages.pickerHint);
      return;
    }
    const range = {
      bookId,
      startChapter,
      startVerse,
      endChapter: startChapter,
      endVerse,
    };
    startTransition(async () => {
      const result = await previewLessonVerseAction(gradeId, range);
      if (!result.ok) {
        setPickerError(
          result.reason === "missing" ? messages.missingVersesTitle : messages.pickerHint,
        );
        if (result.reason === "missing") {
          onAdd({ ...range, text: null, hasMissing: true });
        }
        return;
      }
      onAdd({ ...range, text: result.text, hasMissing: false });
      setChapter("");
      setFromVerse("");
      setToVerse("");
    });
  };

  const busy = disabled || isPending;

  return (
    <div className="mt-5 border-t border-line pt-4">
      <p className="mb-2 text-sm font-medium text-ink">{messages.pickerAdd}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
        <FormSelect
          aria-label={messages.pickerBook}
          value={bookId}
          disabled={busy}
          options={books.map((book) => ({
            value: book.id,
            label: messages.locale === APP_LOCALE.EN ? book.titleEn : book.titleRu,
          }))}
          onValueChange={setBookId}
        />
        </div>
        <Input
          inputMode="numeric"
          placeholder={messages.pickerChapter}
          aria-label={messages.pickerChapter}
          value={chapter}
          disabled={busy}
          onChange={(e) => setChapter(e.target.value)}
        />
        <Input
          inputMode="numeric"
          placeholder={messages.pickerFrom}
          aria-label={messages.pickerFrom}
          value={fromVerse}
          disabled={busy}
          onChange={(e) => setFromVerse(e.target.value)}
        />
        <Input
          inputMode="numeric"
          className="col-span-2"
          placeholder={messages.pickerTo}
          aria-label={messages.pickerTo}
          value={toVerse}
          disabled={busy}
          onChange={(e) => setToVerse(e.target.value)}
        />
      </div>
      <p className="mt-2 text-sm text-ink-2">{messages.pickerHint}</p>
      {pickerError ? <AlertText className="mt-2">{pickerError}</AlertText> : null}
      <Button type="button" variant="outline" className="mt-3 w-full min-h-11" disabled={busy} onClick={handleAdd}>
        <PlusIcon className="size-4" aria-hidden />
        {messages.pickerAdd}
      </Button>
    </div>
  );
};
