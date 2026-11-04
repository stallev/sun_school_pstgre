import { connection } from "next/server";
import { Plus } from "lucide-react";
import { USER_ROLE } from "@sunschool/domain";
import { CalendarEventForm } from "@/components/teacher/CalendarEventForm";
import { CalendarMonth } from "@/components/teacher/CalendarMonth";
import { CalendarMonthHeader } from "@/components/teacher/CalendarMonthHeader";
import { LessonsGradeFilter } from "@/components/teacher/LessonsGradeFilter";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Banner } from "@/components/patterns/Banner";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { loadCalendarPage } from "@/data/calendar/load-calendar-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import {
  resolveCalendarMonthKey,
  todayIsoInTimeZone,
  todayMonthKeyInTimeZone,
} from "@/lib/calendar/calendar-month-key";
import { getSchoolTimezone } from "@/lib/i18n/get-school-timezone.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { fillMessage } from "@/lib/messages/fill-message";
import { pickTeacherCalendarMessages } from "@/lib/messages/pick-teacher-calendar-messages.server";
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";

export type CalendarPageProps = {
  searchParams: Promise<{ gradeId?: string; month?: string; eventId?: string; date?: string }>;
};

const calendarHref = (gradeId: string, month: string, extra?: Record<string, string>) => {
  const params = new URLSearchParams({ gradeId, month, ...extra });
  return `/calendar?${params.toString()}`;
};

export const CalendarPageContent = async ({
  searchParams }: CalendarPageProps) => {
  await connection();
  const params = await searchParams;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN, USER_ROLE.PARENT);
  const timeZone = await getSchoolTimezone();
  const resolvedMonthParam = resolveCalendarMonthKey(params.month ?? null, timeZone);
  const data = await loadCalendarPage(
    await getPrisma(),
    actor.userId,
    params.gradeId ?? null,
    resolvedMonthParam,
  );
  const locale = await getUiLocale();
  const appLocale = messageLocaleToAppLocale(locale);
  const teacherDict = await getDictionary(locale, "teacher");
  const parentDict = actor.roles.includes(USER_ROLE.PARENT) ? await getDictionary(locale, "parent") : null;
  const commonDict = await getDictionary(locale, "common");
  const messages = pickTeacherCalendarMessages(teacherDict, appLocale);
  const listMessages = pickTeacherLessonScreensMessages(teacherDict, appLocale);
  const formError = getMessage(commonDict, "errors.form");
  const dictionaries = { teacher: teacherDict, common: commonDict };

  if (data.kind === "no_active_year") {
    return (
      <div className="space-y-6">
        <PageHeader title={messages.pageTitle} />
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
        <PageHeader title={messages.pageTitle} />
        <EmptyState title={listMessages.unassignedTitle} description={listMessages.unassignedDescription} />
      </div>
    );
  }

  const editEvent = params.eventId
    ? data.events.find((event) => event.eventId === params.eventId) ?? null
    : null;
  const closeHref = calendarHref(data.gradeId, data.monthKey);
  const todayMonthKey = todayMonthKeyInTimeZone(timeZone);
  const todayIso = todayIsoInTimeZone(timeZone);

  const isParentViewer =
    actor.roles.includes(USER_ROLE.PARENT) &&
    !actor.roles.includes(USER_ROLE.TEACHER) &&
    !actor.roles.includes(USER_ROLE.ADMIN);
  const pageDescription = isParentViewer && parentDict
    ? getMessage(parentDict, "calendar.page_subtitle")
    : fillMessage(messages.pageSubtitle, {
        group: data.gradeName,
        year: data.yearName,
      });

  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.pageTitle}
        description={pageDescription}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <CalendarMonthHeader
              gradeId={data.gradeId}
              monthKey={data.monthKey}
              todayMonthKey={todayMonthKey}
              calendarHref={(gradeId, month) => calendarHref(gradeId, month)}
              messages={messages}
            />
            {data.canMutate ? (
              <Button
                render={
                  <CustomLink href={calendarHref(data.gradeId, data.monthKey, { date: `${data.monthKey}-01` })} />
                }
              >
                <Plus className="size-4" aria-hidden />
                {messages.newEvent}
              </Button>
            ) : null}
          </div>
        }
      />
      {data.yearClosed ? (
        <Banner tone="warning" title={listMessages.yearClosedTitle}>
          <p>{listMessages.yearClosedDescription}</p>
        </Banner>
      ) : null}
      {data.isAdmin && data.grades.length > 1 ? (
        <LessonsGradeFilter
          grades={data.grades}
          gradeId={data.gradeId}
          gradeFilterLabel={listMessages.gradeFilterLabel}
          gradeFilterApply={listMessages.gradeFilterApply}
          actionPath="/calendar"
          hiddenFields={{ month: data.monthKey }}
        />
      ) : null}
      {data.events.length === 0 && data.birthdays.length === 0 && !params.date && !params.eventId ? (
        <EmptyState title={messages.emptyMonth} description={messages.emptyMonthCta} />
      ) : null}
      <CalendarMonth
        monthKey={data.monthKey}
        gradeId={data.gradeId}
        events={data.events}
        birthdays={data.birthdays}
        canMutate={data.canMutate}
        messages={messages}
        todayIso={todayIso}
        openEventId={params.eventId ?? null}
        openDate={params.date ?? null}
      />
      <CalendarEventForm
        key={`${params.eventId ?? ""}:${params.date ?? ""}`}
        gradeId={data.gradeId}
        messages={messages}
        dictionaries={dictionaries}
        uiLocale={locale}
        formError={formError}
        canMutate={data.canMutate}
        lessonsForLink={data.lessonsForLink}
        editEvent={editEvent}
        defaultDate={params.date ?? null}
        closeHref={closeHref}
      />
    </div>
  );
};

