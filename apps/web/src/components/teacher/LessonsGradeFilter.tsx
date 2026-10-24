"use client";

import { ContentText } from "@/components/atoms/ContentText";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import type { LessonsListGradeOption } from "@/data/lessons/load-lessons-list-page.server";
import type { TeacherLessonScreensMessages } from "@/lib/messages/teacher-lesson-screens-messages";

type LessonsGradeFilterProps = {
  grades: LessonsListGradeOption[];
  gradeId: string;
  messages: TeacherLessonScreensMessages;
  actionPath?: string;
  hiddenFields?: Record<string, string>;
};

export const LessonsGradeFilter = ({
  grades,
  gradeId,
  messages,
  actionPath = "/lessons",
  hiddenFields,
}: LessonsGradeFilterProps) => (
  <form method="get" action={actionPath} className="flex flex-wrap items-end gap-2">
    {hiddenFields
      ? Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))
      : null}
    <label className="grid gap-1">
      <ContentText className="text-sm font-medium text-ink">{messages.gradeFilterLabel}</ContentText>
      <FormSelect
        name="gradeId"
        defaultValue={gradeId}
        options={grades.map((grade) => ({ value: grade.gradeId, label: grade.name }))}
        triggerClassName="min-w-[12rem]"
      />
    </label>
    <Button type="submit" variant="outline">{messages.gradeFilterApply}</Button>
  </form>
);
