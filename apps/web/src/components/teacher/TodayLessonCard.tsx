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
    <article className="space-y-5 rounded-xl border border-line bg-surface p-4 md:p-6">
      {yearClosed ? (
        <Banner tone="warning" title={messages.yearClosedTitle}>
          <p>{messages.yearClosedDescription}</p>
        </Banner>
      ) : null}
      <div className="space-y-1">
        <ContentText tone="secondary" className="text-sm">
          {messages.todayIncompleteLabel}
        </ContentText>
        <SectionTitle>{messages.lessonCardTitle(lesson.ordinal, lesson.title)}</SectionTitle>
        <ContentText tone="secondary" className="text-sm">
          {dateLine}
        </ContentText>
      </div>
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <ContentText className="text-sm text-ink-2">{messages.todayCheckedStudentsLabel}</ContentText>
          <NumberDisplay className="text-3xl tabular-nums">
            {checkedCount}
            <span className="text-base text-muted"> / {lesson.totalPupils}</span>
          </NumberDisplay>
        </div>
        <Progress value={progressValue} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button render={<CustomLink href={`/lessons/${lesson.lessonId}/check`} />}>
          {messages.todayContinueCheck}
        </Button>
        {canMutate ? (
          <Button
            variant="outline"
            render={<CustomLink href={`/lessons/new?gradeId=${gradeId}`} />}
          >
            {messages.newLesson}
          </Button>
        ) : null}
      </div>
    </article>
  );
};
