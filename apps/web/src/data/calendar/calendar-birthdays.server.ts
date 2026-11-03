import "server-only";

import { birthdayEventDateIso } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { isoFromCalendarDate } from "@/data/school/calendar-date";
import type { CalendarBirthdayRow } from "./load-calendar-page.server";

const monthBounds = (monthKey: string): { start: Date; end: Date } => {
  const [yearPart, monthPart] = monthKey.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return { start, end };
};

export async function loadCalendarBirthdays(
  db: PrismaClient,
  gradeId: string,
  academicYearId: string,
  monthKey: string,
  isParent: boolean,
): Promise<CalendarBirthdayRow[]> {
  if (isParent) return [];

  const [yearPart, monthPart] = monthKey.split("-");
  const viewYear = Number(yearPart);
  const viewMonth = Number(monthPart);
  const { start, end } = monthBounds(monthKey);

  const enrollments = await db.enrollment.findMany({
    where: {
      gradeId,
      academicYearId,
      startsOn: { lte: end },
      OR: [{ endsOn: null }, { endsOn: { gte: start } }],
      pupil: { birthDate: { not: null } },
    },
    select: {
      pupil: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          middleName: true,
          birthDate: true,
        },
      },
    },
  });

  const rows: CalendarBirthdayRow[] = [];
  for (const enrollment of enrollments) {
    const birthDateIso = isoFromCalendarDate(enrollment.pupil.birthDate!);
    const eventDateIso = birthdayEventDateIso(birthDateIso, viewYear, viewMonth);
    if (!eventDateIso) continue;
    const dayOfMonth = Number(eventDateIso.slice(8, 10));
    rows.push({
      pupilId: enrollment.pupil.id,
      dayOfMonth,
      eventDateIso,
      displayName: formatDisplayName(enrollment.pupil),
    });
  }

  return rows.sort(
    (a, b) =>
      a.dayOfMonth - b.dayOfMonth ||
      a.displayName.localeCompare(b.displayName, "ru"),
  );
}
