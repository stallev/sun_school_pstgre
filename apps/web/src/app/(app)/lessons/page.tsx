import { USER_ROLE } from "@sunschool/domain";
import { LessonListRow } from "@/components/teacher/LessonListRow";
import { LessonsGradeFilter } from "@/components/teacher/LessonsGradeFilter";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Banner } from "@/components/patterns/Banner";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { loadLessonsListPage } from "@/data/lessons/load-lessons-list-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";

type LessonsPageProps = {
  searchParams: Promise<{ gradeId?: string }>;
};

const LessonsPage = async ({ searchParams }: LessonsPageProps) => {
  const params = await searchParams;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const data = await loadLessonsListPage(await getPrisma(), actor.userId, params.gradeId ?? null);
  const locale = await getUiLocale();
  const teacherDict = await getDictionary(locale, "teacher");
  const messages = pickTeacherLessonScreensMessages(teacherDict, messageLocaleToAppLocale(locale));

  if (data.kind === "no_active_year") {
    return (
      <div className="space-y-6">
        <PageHeader title={messages.listTitle} />
        <EmptyState
          title={getMessage(teacherDict, "lesson.no_year_title")}
          description={getMessage(teacherDict, "lesson.no_year_description")}
        />
      </div>
    );
  }

  if (data.kind === "unassigned") {
    return (
      <div className="space-y-6">
        <PageHeader title={messages.listTitle} />
        <EmptyState title={messages.unassignedTitle} description={messages.unassignedDescription} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.listTitle}
        description={messages.listSubtitle(data.gradeName, data.yearName)}
        actions={
          data.canMutate ? (
            <Button render={<CustomLink href={`/lessons/new?gradeId=${data.gradeId}`} />}>
              {messages.newLesson}
            </Button>
          ) : null
        }
      />
      {data.yearClosed ? (
        <Banner tone="warning" title={messages.yearClosedTitle}>
          <p>{messages.yearClosedDescription}</p>
        </Banner>
      ) : null}
      {data.isAdmin && data.grades.length > 1 ? (
        <LessonsGradeFilter grades={data.grades} gradeId={data.gradeId} messages={messages} />
      ) : null}
      {data.lessons.length === 0 ? (
        <EmptyState
          title={messages.emptyLessonsTitle}
          description={messages.emptyLessonsDescription}
          action={
            data.canMutate ? (
              <Button render={<CustomLink href={`/lessons/new?gradeId=${data.gradeId}`} />}>
                {messages.emptyLessonsAction}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface divide-y divide-line">
          {data.lessons.map((row) => (
            <LessonListRow key={row.lessonId} row={row} messages={messages} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LessonsPage;
