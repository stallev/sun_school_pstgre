import { USER_ROLE } from "@sunschool/domain";
import { TodayLessonCard } from "@/components/teacher/TodayLessonCard";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { loadTodayPage } from "@/data/lessons/load-today-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";

const TodayPage = async () => {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const data = await loadTodayPage(await getPrisma(), actor.userId);
  const locale = await getUiLocale();
  const appLocale = messageLocaleToAppLocale(locale);
  const teacherDict = await getDictionary(locale, "teacher");
  const messages = pickTeacherLessonScreensMessages(teacherDict, appLocale);

  if (data.kind === "no_active_year") {
    return (
      <div className="space-y-6">
        <PageHeader title={getMessage(teacherDict, "lesson.today.page_title")} />
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
        <PageHeader title={getMessage(teacherDict, "lesson.today.page_title")} />
        <EmptyState title={messages.unassignedTitle} description={messages.unassignedDescription} />
      </div>
    );
  }

  const pageSubtitle = messages.todayPageSubtitle(data.gradeName, data.yearName);

  return (
    <div className="space-y-6">
      <PageHeader
        title={getMessage(teacherDict, "lesson.today.page_title")}
        description={pageSubtitle}
        actions={
          data.canMutate ? (
            <Button render={<CustomLink href={`/lessons/new?gradeId=${data.gradeId}`} />}>
              {messages.newLesson}
            </Button>
          ) : null
        }
      />
      {data.lesson ? (
        <TodayLessonCard
          lesson={data.lesson}
          gradeId={data.gradeId}
          yearClosed={data.yearClosed}
          canMutate={data.canMutate}
          messages={messages}
        />
      ) : (
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
      )}
    </div>
  );
};

export default TodayPage;
