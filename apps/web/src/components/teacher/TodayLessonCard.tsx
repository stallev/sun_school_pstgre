import { ChevronRightIcon, PlusIcon } from "lucide-react";
import { ContentText, SectionTitle } from "@/components/atoms";
import { Banner } from "@/components/patterns/Banner";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { LessonInlineProgress } from "@/components/teacher/LessonInlineProgress";
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
  const heading = messages.lessonDisplaySubtitle(
    lesson.ordinal,
    lesson.title,
    lesson.lessonDateLabel,
  );
  const subline = messages.todayLessonSubline(lesson.ordinal, lesson.title, lesson.verseRefsLabel);
  const progressLabel = messages.checkPartial(checkedCount, lesson.totalPupils);

  return (
    <article className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      {yearClosed ? (
        <Banner tone="warning" title={messages.yearClosedTitle}>
          <p>{messages.yearClosedDescription}</p>
        </Banner>
      ) : null}
      <p className="text-sm text-muted">{messages.todayIncompleteLabel}</p>
      <SectionTitle className="mt-1">{heading}</SectionTitle>
      {subline ? (
        <ContentText tone="secondary" className="mt-1 text-sm">
          {subline}
        </ContentText>
      ) : null}
      <div className="mt-5">
        <LessonInlineProgress
          checked={checkedCount}
          total={lesson.totalPupils}
          label={progressLabel}
        />
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
