import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { USER_ROLE } from "@sunschool/domain";
import { CalendarEventForm } from "@/components/teacher/CalendarEventForm";
import { CalendarMonth } from "@/components/teacher/CalendarMonth";
import { LessonsGradeFilter } from "@/components/teacher/LessonsGradeFilter";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Banner } from "@/components/patterns/Banner";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { loadCalendarPage } from "@/data/calendar/load-calendar-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { fillMessage } from "@/lib/messages/fill-message";
import { pickTeacherCalendarMessages } from "@/lib/messages/pick-teacher-calendar-messages.server";
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";

type CalendarPageProps = {
  searchParams: Promise<{ gradeId?: string; month?: string; eventId?: string; date?: string }>;
};

const shiftMonth = (monthKey: string, delta: number): string => {
  const [yearPart, monthPart] = monthKey.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};

const calendarHref = (gradeId: string, month: string, extra?: Record<string, string>) => {
  const params = new URLSearchParams({ gradeId, month, ...extra });
  return `/calendar?${params.toString()}`;
};

const CalendarPage = async ({ searchParams }: CalendarPageProps) => {
  const params = await searchParams;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const data = await loadCalendarPage(
    await getPrisma(),
    actor.userId,
    params.gradeId ?? null,
    params.month ?? null,
  );
  const locale = await getUiLocale();
  const appLocale = messageLocaleToAppLocale(locale);
  const teacherDict = await getDictionary(locale, "teacher");
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
  const prevMonth = shiftMonth(data.monthKey, -1);
  const nextMonth = shiftMonth(data.monthKey, 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.pageTitle}
        description={fillMessage(messages.pageSubtitle, {
          group: data.gradeName,
          year: data.yearName,
        })}
        actions={
          data.canMutate ? (
            <Button render={<CustomLink href={calendarHref(data.gradeId, data.monthKey, { date: `${data.monthKey}-01` })} />}>
              <Plus className="size-4" aria-hidden />
              {messages.newEvent}
            </Button>
          ) : null
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
          messages={listMessages}
          actionPath="/calendar"
          hiddenFields={{ month: data.monthKey }}
        />
      ) : null}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          render={<CustomLink href={calendarHref(data.gradeId, prevMonth)} aria-label={messages.prevMonth} />}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <Button
          variant="outline"
          size="icon"
          render={<CustomLink href={calendarHref(data.gradeId, nextMonth)} aria-label={messages.nextMonth} />}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
      {data.events.length === 0 && !params.date && !params.eventId ? (
        <EmptyState title={messages.emptyMonth} description={messages.emptyMonthCta} />
      ) : null}
      <CalendarMonth
        monthKey={data.monthKey}
        gradeId={data.gradeId}
        events={data.events}
        canMutate={data.canMutate}
        messages={messages}
        openEventId={params.eventId ?? null}
        openDate={params.date ?? null}
      />
      <CalendarEventForm
        key={`${params.eventId ?? ""}:${params.date ?? ""}`}
        gradeId={data.gradeId}
        messages={messages}
        dictionaries={dictionaries}
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

export default CalendarPage;
