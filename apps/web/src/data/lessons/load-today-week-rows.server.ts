import "server-only";

import type { PrismaClient } from "@sunschool/db";
import { loadBricksBalanceInTransaction } from "@/data/bricks/bricks-shared.server";
import type { LessonsListRow } from "@/data/lessons/load-lessons-list-page.server";
import { formatLessonDisplayDate } from "@/lib/lesson/format-lesson-display-date";
import type { TeacherLessonScreensMessages } from "@/lib/messages/teacher-lesson-screens-messages";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { lessonDateToIso } from "./lesson-shared.server";

export type TodayWeekRow = {
  id: string;
  label: string;
  description: string;
  href: string;
  openLabel: string;
};

type BuildTodayWeekRowsInput = {
  db: PrismaClient;
  gradeId: string;
  yearId: string;
  lessons: LessonsListRow[];
  todayIso: string;
  timeZone: string;
  messages: TeacherLessonScreensMessages;
};

export async function buildTodayWeekRows({
  db,
  gradeId,
  yearId,
  lessons,
  todayIso,
  timeZone,
  messages,
}: BuildTodayWeekRowsInput): Promise<TodayWeekRow[]> {
  const rows: TodayWeekRow[] = [];

  const nextLesson = lessons
    .filter((lesson) => lesson.lessonDateIso > todayIso)
    .sort((left, right) => left.lessonDateIso.localeCompare(right.lessonDateIso))[0];

  if (nextLesson) {
    const dateLabel = formatLessonDisplayDate(nextLesson.lessonDateIso, {
      locale: messages.locale,
      timeZone,
      weekday: "short",
    });
    rows.push({
      id: "next-lesson",
      label: messages.todayWeekNextLesson,
      description: messages.todayWeekNextLessonValue(dateLabel, nextLesson.ordinal, nextLesson.title),
      href: `/lessons/${nextLesson.lessonId}`,
      openLabel: messages.todayWeekOpen(messages.todayWeekNextLesson),
    });
  }

  const lateCheck = await db.homeworkCheck.findFirst({
    where: {
      late: true,
      lesson: { gradeId, academicYearId: yearId },
    },
    orderBy: { checkedAt: "desc" },
    select: {
      lesson: { select: { id: true, lessonDate: true } },
      pupil: { select: { lastName: true, firstName: true, middleName: true } },
    },
  });

  if (lateCheck) {
    const lessonDateIso = lessonDateToIso(lateCheck.lesson.lessonDate);
    const dateLabel = formatLessonDisplayDate(lessonDateIso, {
      locale: messages.locale,
      timeZone,
    });
    rows.push({
      id: "late-submission",
      label: messages.todayWeekLate,
      description: messages.todayWeekLateValue(formatDisplayName(lateCheck.pupil), dateLabel),
      href: `/lessons/${lateCheck.lesson.id}/check`,
      openLabel: messages.todayWeekOpen(messages.todayWeekLate),
    });
  }

  const enrollments = await db.enrollment.findMany({
    where: { gradeId, academicYearId: yearId, endsOn: null },
    select: {
      pupil: {
        select: { id: true, lastName: true, firstName: true, middleName: true },
      },
    },
  });

  let bricksToIssue = 0;
  let hasNegativeBalance = false;
  for (const row of enrollments) {
    const snapshot = await db.$transaction((tx) =>
      loadBricksBalanceInTransaction(tx, row.pupil.id, yearId),
    );
    const unissued = Math.max(0, snapshot.earned - snapshot.issued);
    bricksToIssue += unissued;
    if (snapshot.balance < 0) {
      hasNegativeBalance = true;
    }
  }

  if (bricksToIssue > 0 || hasNegativeBalance) {
    const bricksDescription = messages.todayWeekBricksValue(bricksToIssue);
    rows.push({
      id: "bricks",
      label: messages.todayWeekBricks,
      description: hasNegativeBalance
        ? `${bricksDescription} · ${messages.todayWeekBricksNegativeHint}`
        : bricksDescription,
      href: "/bricks",
      openLabel: messages.todayWeekOpen(messages.todayWeekBricks),
    });
  }

  return rows;
}
