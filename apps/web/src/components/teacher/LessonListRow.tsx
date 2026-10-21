import { LESSON_KIND } from "@sunschool/domain";
import { ChevronRightIcon } from "lucide-react";
import { ContentText, NumberDisplay } from "@/components/atoms";
import { StatusText } from "@/components/ui/status-text";
import { CustomLink } from "@/components/ui/custom-link";
import type { LessonListRowView } from "@/data/lessons/build-lesson-list-row-views.server";
import type { TeacherLessonScreensMessages } from "@/lib/messages/teacher-lesson-screens-messages";

type LessonListRowProps = {
  row: LessonListRowView;
  messages: TeacherLessonScreensMessages;
};

export const LessonListRow = ({ row, messages }: LessonListRowProps) => {
  const checkedCount = Math.min(row.checkedCount, row.totalPupils);
  const isReview = row.kind === LESSON_KIND.REVIEW;
  const checkLabel =
    row.totalPupils > 0
      ? messages.listCheckFraction(checkedCount, row.totalPupils)
      : messages.checkNotStarted;
  const checkTone =
    row.totalPupils === 0
      ? "neutral"
      : checkedCount >= row.totalPupils
        ? "ok"
        : "warn";

  const secondaryLine = isReview ? messages.listReviewSubline : row.verseRefsLabel;

  return (
    <CustomLink
      href={`/lessons/${row.lessonId}`}
      className="grid w-full grid-cols-1 gap-3 px-5 py-4 text-left transition-colors hover:bg-paper/70 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-6"
    >
      <span className="flex items-baseline gap-3 sm:block">
        <NumberDisplay size="kpi" className="leading-none">
          {row.lessonDateShortLabel}
        </NumberDisplay>
        <ContentText tone="secondary" className="text-sm sm:mt-1">
          {messages.listOrdinalShort(row.ordinal)}
        </ContentText>
      </span>
      <span className="min-w-0">
        <ContentText className="font-medium text-ink">
          {row.title}
          {isReview ? (
            <span className="ml-2 rounded-md bg-paper px-1.5 py-px align-middle text-xs font-medium text-ink-2 ring-1 ring-line">
              {messages.listReviewBadge}
            </span>
          ) : null}
        </ContentText>
        {secondaryLine ? (
          <ContentText tone="secondary" className="mt-0.5 block text-sm">
            {secondaryLine}
          </ContentText>
        ) : null}
      </span>
      <span className="flex items-center justify-between gap-4 sm:justify-end">
        <StatusText tone={checkTone} className="shrink-0 text-sm">
          {checkLabel}
        </StatusText>
        <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-muted" />
      </span>
    </CustomLink>
  );
};
