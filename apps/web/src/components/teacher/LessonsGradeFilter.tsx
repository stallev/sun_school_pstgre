import { ContentText } from "@/components/atoms/ContentText";
import { Button } from "@/components/ui/button";
import type { LessonsListGradeOption } from "@/data/lessons/load-lessons-list-page.server";
import type { TeacherLessonScreensMessages } from "@/lib/messages/teacher-lesson-screens-messages";

type LessonsGradeFilterProps = {
  grades: LessonsListGradeOption[];
  gradeId: string;
  messages: TeacherLessonScreensMessages;
  actionPath?: string;
};

export const LessonsGradeFilter = ({
  grades,
  gradeId,
  messages,
  actionPath = "/lessons",
}: LessonsGradeFilterProps) => (
  <form method="get" action={actionPath} className="flex flex-wrap items-end gap-2">
    <label className="grid gap-1">
      <ContentText className="text-sm font-medium text-ink">{messages.gradeFilterLabel}</ContentText>
      <select
        name="gradeId"
        defaultValue={gradeId}
        className="min-h-11 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
      >
        {grades.map((grade) => (
          <option key={grade.gradeId} value={grade.gradeId}>{grade.name}</option>
        ))}
      </select>
    </label>
    <Button type="submit" variant="outline">{messages.gradeFilterApply}</Button>
  </form>
);
