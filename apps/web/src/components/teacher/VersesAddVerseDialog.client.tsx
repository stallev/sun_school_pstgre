"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { ContentText } from "@/components/atoms/ContentText";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { BibleBookListItem } from "@/data/bible/list-books";
import type { LessonFormVerseRow } from "@/data/lessons/load-lesson-form-page.server";
import type { TeacherLessonFormMessages } from "@/lib/messages/teacher-lesson-messages";
import { VersePicker } from "@/components/teacher/VersePicker";

type VersesAddVerseDialogProps = {
  gradeId: string;
  books: readonly BibleBookListItem[];
  pickerMessages: TeacherLessonFormMessages;
  title: string;
  description: string;
  triggerLabel: string;
  closeLabel: string;
};

export const VersesAddVerseDialog = ({
  gradeId,
  books,
  pickerMessages,
  title,
  description,
  triggerLabel,
  closeLabel,
}: VersesAddVerseDialogProps) => {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<LessonFormVerseRow | null>(null);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setPreview(null);
  };

  const handleAdd = (verse: LessonFormVerseRow) => {
    setPreview(verse);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" className="min-h-11 gap-2">
            <PlusIcon className="size-4" aria-hidden />
            {triggerLabel}
          </Button>
        }
      />
      <DialogContent closeLabel={closeLabel} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <VersePicker
          gradeId={gradeId}
          books={books}
          messages={pickerMessages}
          maxVerses={1}
          currentCount={preview ? 1 : 0}
          onAdd={handleAdd}
        />
        {preview ? (
          <div className="space-y-2 border-t border-line pt-4">
            {preview.hasMissing ? (
              <ContentText className="text-sm text-danger">{pickerMessages.missingVersesTitle}</ContentText>
            ) : (
              <ContentText className="text-sm whitespace-pre-wrap italic text-ink-2">{preview.text}</ContentText>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
