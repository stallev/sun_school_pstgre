import { ChevronRightIcon, PlusIcon } from "lucide-react";
import { ContentText, NumberDisplay, SectionTitle } from "@/components/atoms";
import { Banner } from "@/components/patterns/Banner";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { Progress } from "@/components/ui/progress";
import type { TodayFocalLesson } from "@/data/lessons/load-today-page.server";
import type { TeacherLessonScreensMessages } from "@/lib/messages/teacher-lesson-screens-messages";

type TodayLessonCardProps = {
  lesson: TodayFocalLesson;
  gradeId: string;
  yearClosed: boolean;
  canMutate: boolean;
  messages: TeacherLessonScreensMessages;
};

export const TodayLessonCard = ({
  lesson,
  gradeId,
  yearClosed,
  canMutate,
  messages,
}: TodayLessonCardProps) => {
  const checkedCount = Math.min(lesson.checkedCount, lesson.totalPupils);
  const progressValue =
    lesson.totalPupils > 0 ? Math.round((checkedCount / lesson.totalPupils) * 100) : 0;
  const dateLine = lesson.verseRefsLabel
    ? `${lesson.lessonDateLabel} · ${lesson.verseRefsLabel}`
    : lesson.lessonDateLabel;

  return (
    <article className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      {yearClosed ? (
        <Banner tone="warning" title={messages.yearClosedTitle}>
          <p>{messages.yearClosedDescription}</p>
        </Banner>
      ) : null}
      <p className="text-sm text-muted">{messages.todayIncompleteLabel}</p>
      <SectionTitle className="mt-1">{messages.lessonCardTitle(lesson.ordinal, lesson.title)}</SectionTitle>
      <ContentText tone="secondary" className="mt-1 text-sm">
        {dateLine}
      </ContentText>
      <div className="mt-5 flex items-baseline justify-between gap-3">
        <ContentText className="text-sm text-ink-2">{messages.todayCheckedStudentsLabel}</ContentText>
        <NumberDisplay className="text-3xl tabular-nums">
          {checkedCount}
          <span className="text-base text-muted">
            {" "}
            {messages.todayCheckedOfWord} {lesson.totalPupils}
          </span>
        </NumberDisplay>
      </div>
      <div className="mt-2">
        <Progress value={progressValue} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button render={<CustomLink href={`/lessons/${lesson.lessonId}/check`} />}>
          {messages.todayContinueCheck}
          <ChevronRightIcon aria-hidden />
        </Button>
        {canMutate ? (
          <Button
            variant="ghost"
            render={<CustomLink href={`/lessons/new?gradeId=${gradeId}`} />}
          >
            <PlusIcon aria-hidden />
            {messages.newLesson}
          </Button>
        ) : null}
      </div>
    </article>
  );
};
