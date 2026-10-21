import { BookOpen, Bus, CircleX } from "lucide-react";
import { GRADE_EVENT_TYPE, type GradeEventType } from "@sunschool/domain";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { ContentText } from "@/components/atoms/ContentText";
import { Card } from "@/components/ui/card";
import { CustomLink } from "@/components/ui/custom-link";
import type { CalendarEventRow } from "@/data/calendar/load-calendar-page.server";
import type { TeacherCalendarMessages } from "@/lib/messages/teacher-calendar-messages";
import { cn } from "@/lib/utils";

type CalendarMonthProps = {
  monthKey: string;
  gradeId: string;
  events: CalendarEventRow[];
  canMutate: boolean;
  messages: TeacherCalendarMessages;
  openEventId: string | null;
  openDate: string | null;
};

const typeMeta = (
  type: GradeEventType,
  messages: TeacherCalendarMessages,
): { icon: typeof BookOpen; label: string; className: string } => {
  if (type === GRADE_EVENT_TYPE.TRIP) {
    return { icon: Bus, label: messages.typeTrip, className: "text-ok" };
  }
  if (type === GRADE_EVENT_TYPE.CANCELLATION) {
    return { icon: CircleX, label: messages.typeCancellation, className: "text-danger" };
  }
  return { icon: BookOpen, label: messages.typeLesson, className: "text-cobalt-ink" };
};

const buildHref = (gradeId: string, monthKey: string, extra: Record<string, string>) => {
  const params = new URLSearchParams({ gradeId, month: monthKey, ...extra });
  return `/calendar?${params.toString()}`;
};

const monthCells = (monthKey: string): (number | null)[] => {
  const [yearPart, monthPart] = monthKey.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startOffset = (first.getUTCDay() + 6) % 7;
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

const isoForDay = (monthKey: string, day: number): string =>
  `${monthKey}-${String(day).padStart(2, "0")}`;

export const CalendarMonth = ({
  monthKey,
  gradeId,
  events,
  canMutate,
  messages,
  openEventId,
  openDate,
}: CalendarMonthProps) => {
  const cells = monthCells(monthKey);
  const eventByDay = new Map(events.map((event) => [event.dayOfMonth, event]));

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Card className="min-w-0 p-2 sm:p-4">
        <div className="grid grid-cols-7 text-center text-xs text-muted sm:text-sm">
          {messages.weekdays.map((label) => (
            <div key={label} className="py-2">{label}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-line">
          {cells.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="min-h-14 bg-paper p-1 sm:min-h-24 sm:p-2" />;
            }
            const event = eventByDay.get(day);
            const meta = event ? typeMeta(event.type, messages) : null;
            const dateIso = isoForDay(monthKey, day);
            const isOpen = openDate === dateIso || (event && openEventId === event.eventId);
            const cellInner = (
              <>
                <span className="inline-flex size-7 items-center justify-center rounded-full text-sm tabular-nums">
                  {day}
                </span>
                {meta && event ? (
                  <span className={`mt-0.5 flex items-center gap-1 ${meta.className}`}>
                    <meta.icon className="size-4" aria-hidden />
                    <span className="hidden truncate text-xs sm:inline">{meta.label}</span>
                  </span>
                ) : null}
              </>
            );
            if (canMutate || event) {
              const href = event
                ? buildHref(gradeId, monthKey, { eventId: event.eventId })
                : buildHref(gradeId, monthKey, { date: dateIso });
              return (
                <CustomLink
                  key={dateIso}
                  href={href}
                  className={cn(
                    "flex min-h-14 flex-col items-start justify-start bg-surface p-1 text-left hover:bg-paper sm:min-h-24 sm:p-2",
                    isOpen && "ring-2 ring-ring ring-inset",
                  )}
                >
                  {cellInner}
                </CustomLink>
              );
            }
            return (
              <div key={dateIso} className="min-h-14 bg-surface p-1 sm:min-h-24 sm:p-2">
                {cellInner}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 px-1 text-sm text-ink-2">
          {(
            [
              [GRADE_EVENT_TYPE.LESSON, messages.typeLesson, "text-cobalt-ink"] as const,
              [GRADE_EVENT_TYPE.TRIP, messages.typeTrip, "text-ok"] as const,
              [GRADE_EVENT_TYPE.CANCELLATION, messages.typeCancellation, "text-danger"] as const,
            ] as const
          ).map(([type, label, className]) => {
            const meta = typeMeta(type, messages);
            return (
              <span key={type} className="inline-flex items-center gap-1.5">
                <meta.icon className={cn("size-4", className)} aria-hidden />
                {label}
              </span>
            );
          })}
        </div>
      </Card>
      <section className="min-w-0">
        <SectionTitle className="mb-3">{messages.monthEventsTitle}</SectionTitle>
        <Card className="divide-y divide-line">
          {events.length === 0 ? (
            <ContentText className="px-5 py-4 text-sm text-muted">{messages.emptyMonth}</ContentText>
          ) : (
            events.map((event) => {
              const meta = typeMeta(event.type, messages);
              return (
                <CustomLink
                  key={event.eventId}
                  href={buildHref(gradeId, monthKey, { eventId: event.eventId })}
                  className={cn(
                    "flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-paper/70",
                    openEventId === event.eventId && "bg-paper/70",
                  )}
                >
                  <span className="w-10 shrink-0 font-display text-xl tabular-nums">
                    {event.dayOfMonth}
                  </span>
                  <meta.icon className={cn("size-5 shrink-0", meta.className)} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-ink">{event.title}</span>
                    <span className="block text-sm text-muted">
                      {meta.label}
                      {event.description ? ` · ${event.description}` : ""}
                    </span>
                  </span>
                </CustomLink>
              );
            })
          )}
        </Card>
      </section>
    </div>
  );
};
