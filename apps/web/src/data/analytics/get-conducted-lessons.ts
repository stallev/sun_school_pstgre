import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { LESSON_KIND, type MutationResult } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getPrisma } from "@/lib/db.server";
import { analyticsPeriodFilterSchema } from "./analytics-period";
import type { ResolvedAnalyticsPeriod } from "./analytics-period";
import {
  assertAnalyticsGradeAccess,
  loadActorOrganizationIdForAnalytics,
  periodDateRange,
  resolveAnalyticsPeriodForOrganization,
} from "./analytics-shared.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { isoFromCalendarDate } from "../school/calendar-date";

export type ConductedLessonsTeacherRow = {
  teacherId: string;
  displayName: string;
  conductedCount: number;
  regularCount: number;
  reviewCount: number;
  plannedCount: number;
  lessonOrdinals: number[];
  noLongerAssigned: boolean;
};

export type ConductedLessonsSnapshot = {
  gradeId: string;
  period: ResolvedAnalyticsPeriod;
  teachers: ConductedLessonsTeacherRow[];
};

async function loadConductedLessonsFromDb(
  db: PrismaClient,
  gradeId: string,
  period: ResolvedAnalyticsPeriod,
): Promise<ConductedLessonsSnapshot> {
  const { gte, lte } = periodDateRange(period);
  const todayDate = new Date();
  const today = isoFromCalendarDate(
    new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), todayDate.getUTCDate())),
  );

  const assignments = await db.teacherAssignment.findMany({
    where: { gradeId, academicYearId: period.academicYearId },
    select: {
      userId: true,
      user: { select: { id: true, firstName: true, lastName: true, middleName: true } },
    },
  });
  const assignedIds = new Set(assignments.map((row) => row.userId));

  const lessons = await db.lesson.findMany({
    where: { gradeId, academicYearId: period.academicYearId },
    select: {
      id: true,
      ordinal: true,
      kind: true,
      lessonDate: true,
      leadTeacherId: true,
      checks: { where: { homeworkChecked: true }, select: { id: true }, take: 1 },
      leadTeacher: {
        select: { id: true, firstName: true, lastName: true, middleName: true },
      },
    },
  });

  const byTeacher = new Map<string, ConductedLessonsTeacherRow>();

  const ensureRow = (
    teacherId: string,
    displayName: string,
    noLongerAssigned: boolean,
  ): ConductedLessonsTeacherRow => {
    const existing = byTeacher.get(teacherId);
    if (existing) return existing;
    const row: ConductedLessonsTeacherRow = {
      teacherId,
      displayName,
      conductedCount: 0,
      regularCount: 0,
      reviewCount: 0,
      plannedCount: 0,
      lessonOrdinals: [],
      noLongerAssigned,
    };
    byTeacher.set(teacherId, row);
    return row;
  };

  for (const assignment of assignments) {
    ensureRow(assignment.userId, formatDisplayName(assignment.user), false);
  }

  for (const lesson of lessons) {
    const lessonDateIso = isoFromCalendarDate(lesson.lessonDate);
    const teacher = lesson.leadTeacher;
    const row = ensureRow(
      teacher.id,
      formatDisplayName(teacher),
      !assignedIds.has(teacher.id),
    );

    if (lessonDateIso > today) {
      row.plannedCount += 1;
      continue;
    }
    if (lesson.lessonDate < gte || lesson.lessonDate > lte) {
      continue;
    }
    if (lesson.checks.length === 0) {
      continue;
    }

    row.conductedCount += 1;
    row.lessonOrdinals.push(lesson.ordinal);
    if (lesson.kind === LESSON_KIND.REVIEW) {
      row.reviewCount += 1;
    } else {
      row.regularCount += 1;
    }
  }

  return {
    gradeId,
    period,
    teachers: [...byTeacher.values()].sort((left, right) =>
      left.displayName.localeCompare(right.displayName),
    ),
  };
}

async function loadCachedConductedLessons(
  gradeId: string,
  period: ResolvedAnalyticsPeriod,
): Promise<ConductedLessonsSnapshot> {
  "use cache";
  cacheTag(CACHE_TAGS.analyticsConducted(gradeId, period.academicYearId));
  cacheLife("minutes");
  const db = await getPrisma();
  return loadConductedLessonsFromDb(db, gradeId, period);
}

export async function getConductedLessons(
  db: PrismaClient,
  actorUserId: string,
  gradeId: string,
  rawPeriod: unknown,
): Promise<MutationResult<ConductedLessonsSnapshot>> {
  const parsed = analyticsPeriodFilterSchema.safeParse(rawPeriod);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const access = await db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationIdForAnalytics(tx, actorUserId);
    if (isMutationErr(organizationId)) return organizationId;
    const period = await resolveAnalyticsPeriodForOrganization(
      tx,
      organizationId,
      parsed.data,
    );
    if (isMutationErr(period)) return period;
    const scope = await assertAnalyticsGradeAccess(
      tx,
      actorUserId,
      organizationId,
      gradeId,
      parsed.data.academicYearId,
    );
    if (scope) return scope;
    return { ok: true as const, period };
  });
  if (isMutationErr(access)) return access;

  const data = await loadCachedConductedLessons(gradeId, access.period);
  return { ok: true, data };
}
