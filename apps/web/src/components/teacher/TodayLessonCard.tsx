import { LESSON_KIND } from "@sunschool/domain";
import { ContentText, SectionTitle } from "@/components/atoms";
import { Banner } from "@/components/patterns/Banner";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { StatusText } from "@/components/ui/status-text";
import type { LessonsListRow } from "@/data/lessons/load-lessons-list-page.server";
import type { TeacherLessonScreensMessages } from "@/lib/messages/teacher-lesson-screens-messages";

type TodayLessonCardProps = {
  lesson: LessonsListRow;
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
  const kindLabel =
    lesson.kind === LESSON_KIND.REVIEW ? messages.kindReview : messages.kindRegular;

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
          {lesson.lessonDateIso} · {kindLabel}
        </ContentText>
      </div>
      <div className="space-y-1">
        <ContentText className="text-sm font-medium text-ink">{messages.checkProgressLabel}</ContentText>
        <StatusText tone="info">{messages.todayProgressStub}</StatusText>
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
