import { ChevronLeft, ChevronRight } from "lucide-react";
import { Heading } from "@/components/atoms/Heading";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import {
  formatCalendarMonthName,
  formatCalendarMonthTitle,
} from "@/lib/calendar/format-calendar-month-label";
import { shiftCalendarMonthKey } from "@/lib/calendar/calendar-month-key";
import type { TeacherCalendarMessages } from "@/lib/messages/teacher-calendar-messages";

type CalendarMonthHeaderProps = {
  gradeId: string;
  monthKey: string;
  todayMonthKey: string;
  calendarHref: (gradeId: string, month: string) => string;
  messages: TeacherCalendarMessages;
};

export const CalendarMonthHeader = ({
  gradeId,
  monthKey,
  todayMonthKey,
  calendarHref,
  messages,
}: CalendarMonthHeaderProps) => {
  const { locale } = messages;
  const prevMonth = shiftCalendarMonthKey(monthKey, -1);
  const nextMonth = shiftCalendarMonthKey(monthKey, 1);
  const isTodayMonth = monthKey === todayMonthKey;
  const monthTitle = formatCalendarMonthTitle(monthKey, locale);

  return (
    <div className="flex flex-wrap items-center justify-center gap-chip">
      <div className="flex items-center gap-chip">
        <Button
          variant="outline"
          size="icon"
          render={
            <CustomLink
              href={calendarHref(gradeId, prevMonth)}
              aria-label={formatCalendarMonthName(prevMonth, locale)}
            />
          }
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <Heading as="h2" level="section" className="px-page text-center" aria-live="polite">
          {monthTitle}
        </Heading>
        <Button
          variant="outline"
          size="icon"
          render={
            <CustomLink
              href={calendarHref(gradeId, nextMonth)}
              aria-label={formatCalendarMonthName(nextMonth, locale)}
            />
          }
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
      <Button
        variant="outline"
        className="ml-auto max-md:w-full"
        render={
          <CustomLink
            href={calendarHref(gradeId, todayMonthKey)}
            aria-current={isTodayMonth ? "date" : undefined}
          />
        }
      >
        {messages.today}
      </Button>
    </div>
  );
};
