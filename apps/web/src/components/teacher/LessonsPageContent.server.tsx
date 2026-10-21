import { connection } from "next/server";
import { USER_ROLE } from "@sunschool/domain";
import { LessonListRow } from "@/components/teacher/LessonListRow";
import { LessonsGradeFilter } from "@/components/teacher/LessonsGradeFilter";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Banner } from "@/components/patterns/Banner";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { buildLessonListRowViews } from "@/data/lessons/build-lesson-list-row-views.server";
import { loadLessonsListPage } from "@/data/lessons/load-lessons-list-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getSchoolTimezone } from "@/lib/i18n/get-school-timezone.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";

export type LessonsPageProps = {
  searchParams: Promise<{ gradeId?: string }>;
};

export const LessonsPageContent = async ({ searchParams }: LessonsPageProps) => {
  await connection();
  const params = await searchParams;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const db = await getPrisma();
  const data = await loadLessonsListPage(db, actor.userId, params.gradeId ?? null);
  const locale = await getUiLocale();
  const appLocale = messageLocaleToAppLocale(locale);
  const timeZone = await getSchoolTimezone();
  const teacherDict = await getDictionary(locale, "teacher");
  const messages = pickTeacherLessonScreensMessages(teacherDict, appLocale);

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

  const lessonRows =
    data.lessons.length > 0
      ? await buildLessonListRowViews(db, data.lessons, data.gradeId, appLocale, timeZone)
      : [];

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
      {lessonRows.length === 0 ? (
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
        <ol className="overflow-hidden rounded-xl border border-line bg-surface divide-y divide-line">
          {lessonRows.map((row) => (
            <li key={row.lessonId}>
              <LessonListRow row={row} messages={messages} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

