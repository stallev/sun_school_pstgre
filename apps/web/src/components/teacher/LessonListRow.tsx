import { LESSON_KIND } from "@sunschool/domain";
import { ContentText } from "@/components/atoms/ContentText";
import { StatusText } from "@/components/ui/status-text";
import { CustomLink } from "@/components/ui/custom-link";
import type { LessonsListRow } from "@/data/lessons/load-lessons-list-page.server";
import { formatLessonCheckProgressLabel } from "@/lib/lesson/format-lesson-check-label";
import type { TeacherLessonScreensMessages } from "@/lib/messages/teacher-lesson-screens-messages";

type LessonListRowProps = {
  row: LessonsListRow;
  messages: TeacherLessonScreensMessages;
};

export const LessonListRow = ({ row, messages }: LessonListRowProps) => {
  const kindLabel = row.kind === LESSON_KIND.REVIEW ? messages.kindReview : messages.kindRegular;
  const checkLabel = formatLessonCheckProgressLabel(
    {
      checkedCount: row.checkedCount,
      totalPupils: row.totalPupils,
      status: row.status,
    },
    messages,
  );

  return (
    <CustomLink
      href={`/lessons/${row.lessonId}`}
      className="flex min-h-11 flex-col gap-1 px-4 py-3 transition-colors hover:bg-paper md:flex-row md:items-center md:justify-between"
    >
      <div className="space-y-0.5">
        <ContentText className="font-medium text-ink">
          {messages.lessonCardTitle(row.ordinal, row.title)}
        </ContentText>
        <ContentText tone="secondary" className="text-sm">
          {row.lessonDateIso} · {kindLabel} · {row.leadName}
        </ContentText>
      </div>
      <StatusText tone="neutral" className="shrink-0 text-sm">
        {checkLabel}
      </StatusText>
    </CustomLink>
  );
};
