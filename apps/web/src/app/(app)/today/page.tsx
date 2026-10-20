import { USER_ROLE } from "@sunschool/domain";
import { TodayLessonCard } from "@/components/teacher/TodayLessonCard";
import { TodayWeekSection } from "@/components/teacher/TodayWeekSection";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { loadTodayPage } from "@/data/lessons/load-today-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getSchoolTimezone } from "@/lib/i18n/get-school-timezone.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";
import { resolveTodayGreetingPart } from "@/lib/teacher/resolve-today-greeting-part";

const hourInTimeZone = (timeZone: string): number => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const hourPart = parts.find((part) => part.type === "hour")?.value;
  return hourPart ? Number.parseInt(hourPart, 10) : 12;
};

const TodayPage = async () => {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const locale = await getUiLocale();
  const appLocale = messageLocaleToAppLocale(locale);
  const teacherDict = await getDictionary(locale, "teacher");
  const messages = pickTeacherLessonScreensMessages(teacherDict, appLocale);
  const timeZone = await getSchoolTimezone();
  const data = await loadTodayPage(await getPrisma(), actor.userId, appLocale, timeZone, messages);

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

  const greetingPart = resolveTodayGreetingPart(hourInTimeZone(timeZone));
  const greetingName = data.teacherFirstName || "…";
  const pageTitle = messages.todayGreeting(greetingName, greetingPart);
  const pageSubtitle = messages.todayPageSubtitle(data.gradeName, data.yearName);

  return (
    <div className="space-y-6">
      <PageHeader title={pageTitle} description={pageSubtitle} />
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
              <Button variant="outline" render={<CustomLink href={`/lessons/new?gradeId=${data.gradeId}`} />}>
                {messages.emptyLessonsAction}
              </Button>
            ) : undefined
          }
        />
      )}
      <TodayWeekSection title={messages.todayWeekTitle} rows={data.weekRows} />
    </div>
  );
};

export default TodayPage;
