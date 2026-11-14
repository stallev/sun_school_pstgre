import { LESSON_KIND } from "@sunschool/domain";
import { ChevronRightIcon } from "lucide-react";
import { ContentText, NumberDisplay } from "@/components/atoms";
import { CheckedStateProgressLabel } from "@/components/teacher/CheckedStateProgressLabel";
import { StatusText } from "@/components/ui/status-text";
import { CustomLink } from "@/components/ui/custom-link";
import type { LessonListRowView } from "@/data/lessons/build-lesson-list-row-views.server";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";
import type { TeacherLessonScreensMessages } from "@/lib/messages/teacher-lesson-screens-messages";

type LessonListRowProps = {
  row: LessonListRowView;
  messages: TeacherLessonScreensMessages;
  checkedStateHint: HintTerm;
  termHintAriaLabel: string;
  progressCountsTemplate: string;
};

export const LessonListRow = ({
  row,
  messages,
  checkedStateHint,
  termHintAriaLabel,
  progressCountsTemplate,
}: LessonListRowProps) => {
  const checkedCount = Math.min(row.checkedCount, row.totalPupils);
  const isReview = row.kind === LESSON_KIND.REVIEW;

  const secondaryLine = isReview ? messages.listReviewSubline : row.verseRefsLabel;

  return (
    <CustomLink
      href={`/lessons/${row.lessonId}`}
      className="grid w-full grid-cols-1 gap-stack p-card text-left transition-colors hover:bg-paper/70 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:items-center"
    >
      <span className="flex items-baseline gap-3 sm:block sm:col-start-1">
        <NumberDisplay size="kpi" className="leading-none">
          {row.lessonDateShortLabel}
        </NumberDisplay>
      </span>
      <span className="min-w-0 sm:col-start-2">
        <ContentText className="font-medium text-ink">
          {messages.listRowTitle(row.ordinal, row.title)}
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
        {row.totalPupils > 0 ? (
          <CheckedStateProgressLabel
            hint={checkedStateHint}
            countsTemplate={progressCountsTemplate}
            checked={checkedCount}
            total={row.totalPupils}
            termHintAriaLabel={termHintAriaLabel}
            className="shrink-0 text-sm tabular-nums text-ink-2"
          />
        ) : (
          <StatusText tone="neutral" className="shrink-0 text-sm">
            {messages.checkNotStarted}
          </StatusText>
        )}
        <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-muted" />
      </span>
    </CustomLink>
  );
};
