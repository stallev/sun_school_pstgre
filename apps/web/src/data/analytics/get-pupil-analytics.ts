import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import {
  classifySampleLayer,
  computeAttendanceCounts,
  computeNormalizedPercent,
  computeTrend,
  movingAverage,
  MUTATION_ERROR_CODES,
  resolveSampleCountingStartDate,
  type MutationResult,
  type SampleLayer,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getPrisma } from "@/lib/db.server";
import { analyticsPeriodFilterSchema } from "./analytics-period";
import type { ResolvedAnalyticsPeriod } from "./analytics-period";
import {
  assertAnalyticsPupilAccess,
  loadActorOrganizationIdForAnalytics,
  periodDateRange,
  resolveAnalyticsPeriodForOrganization,
} from "./analytics-shared.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { isoFromCalendarDate } from "../school/calendar-date";
import { isoFromEnrollmentStartsOn } from "../school/school-enrollment-shared.server";

export type PupilLessonAnalyticsRow = {
  lessonId: string;
  lessonDate: string;
  title: string;
  present: boolean | null;
  homeworkChecked: boolean;
  versesRecited: number | null;
  versesTotal: number | null;
  testScore: number | null;
  notebookScore: number | null;
  testConducted: boolean;
  submittedLate: boolean;
};

export type PupilAnalyticsSnapshot = {
  pupilId: string;
  period: ResolvedAnalyticsPeriod;
  sampleLayer: SampleLayer;
  attendanceRate: number | null;
  lessons: PupilLessonAnalyticsRow[];
  dynamics: {
    normalizedPoints: { lessonId: string; lessonDate: string; percent: number | null }[];
    smoothed: { lessonId: string; lessonDate: string; percent: number | null }[];
    trendSlope: number | null;
    trendPointCount: number;
  };
};

async function loadPupilAnalyticsFromDb(
  db: PrismaClient,
  pupilId: string,
  gradeId: string,
  period: ResolvedAnalyticsPeriod,
): Promise<PupilAnalyticsSnapshot> {
  const { gte, lte } = periodDateRange(period);
  const enrollment = await db.enrollment.findFirst({
    where: { pupilId, gradeId, academicYearId: period.academicYearId },
    select: { startsOn: true, pupil: { select: { isActive: true } } },
  });
  if (!enrollment) {
    throw new Error("enrollment missing");
  }

  const lessons = await db.lesson.findMany({
    where: {
      gradeId,
      academicYearId: period.academicYearId,
      lessonDate: { gte, lte },
      checks: { some: { pupilId, homeworkChecked: true } },
    },
    select: {
      id: true,
      title: true,
      lessonDate: true,
      ordinal: true,
      hasTest: true,
      checks: {
        where: { pupilId },
        select: {
          present: true,
          homeworkChecked: true,
          late: true,
          testScore: true,
          notebookScore: true,
          pointsTotal: true,
          verseScores: { select: { score: true } },
        },
      },
      verses: { select: { id: true } },
    },
    orderBy: [{ lessonDate: "asc" }, { ordinal: "asc" }],
  });

  const yearLessons = await db.lesson.findMany({
    where: { gradeId, academicYearId: period.academicYearId },
    select: { id: true, lessonDate: true },
  });
  const yearChecks = await db.homeworkCheck.findMany({
    where: { pupilId, lessonId: { in: yearLessons.map((row) => row.id) } },
    select: { lessonId: true, homeworkChecked: true },
  });

  const lessonChecked = (lessonId: string) =>
    yearChecks.some((row) => row.lessonId === lessonId && row.homeworkChecked);

  const countingStart = resolveSampleCountingStartDate(
    isoFromEnrollmentStartsOn(enrollment.startsOn),
    earliestCheckedDate(yearChecks, yearLessons),
  );

  const attendanceRows = yearLessons.map((lesson) => {
    const check = yearChecks.find((row) => row.lessonId === lesson.id);
    const lessonDateIso = isoFromCalendarDate(lesson.lessonDate);
    return {
      lessonDate: lessonDateIso,
      isCheckedLesson: lessonChecked(lesson.id),
      hasPupilRecord: Boolean(check),
      present: false,
      onOrAfterCountingStart: countingStart ? lessonDateIso >= countingStart : false,
    };
  });
  const attendance = computeAttendanceCounts(attendanceRows);
  const sampleLayer = classifySampleLayer({
    pupilIsActive: enrollment.pupil.isActive,
    countingStartDate: countingStart,
    attendance,
    hasCheckedLessonAfterCountingStart: attendanceRows.some(
      (row) => row.onOrAfterCountingStart && row.isCheckedLesson && row.hasPupilRecord,
    ),
  });

  const lessonRows: PupilLessonAnalyticsRow[] = lessons.map((lesson) => {
    const check = lesson.checks[0];
    const versesTotal = lesson.verses.length;
    const versesRecited =
      check && check.verseScores
        ? check.verseScores.filter((row) => row.score === 1 || row.score === 2).length
        : null;
    return {
      lessonId: lesson.id,
      lessonDate: isoFromCalendarDate(lesson.lessonDate),
      title: lesson.title,
      present: check ? check.present : null,
      homeworkChecked: check?.homeworkChecked ?? false,
      versesRecited,
      versesTotal: versesTotal > 0 ? versesTotal : null,
      testScore: check?.testScore ?? null,
      notebookScore: check?.notebookScore ?? null,
      testConducted: lesson.hasTest,
      submittedLate: check?.late ?? false,
    };
  });

  const normalizedPoints = lessons
    .map((lesson) => {
      const check = lesson.checks[0];
      if (!check?.homeworkChecked || (!check.present && !check.late)) {
        return null;
      }
      const points = check.pointsTotal ?? 0;
      const maximum = Math.max(points, 1);
      return {
        lessonId: lesson.id,
        lessonDate: isoFromCalendarDate(lesson.lessonDate),
        percent: computeNormalizedPercent(points, maximum),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null && row.percent !== null);

  const smoothedValues = movingAverage(
    normalizedPoints.map((row) => row.percent as number),
  );
  const smoothed = normalizedPoints.map((row, index) => ({
    lessonId: row.lessonId,
    lessonDate: row.lessonDate,
    percent: smoothedValues[index] ?? null,
  }));

  const trend = computeTrend(normalizedPoints.map((row) => row.percent as number));
  const trendSlope = trend.slopePpPerLesson;

  return {
    pupilId,
    period,
    sampleLayer,
    attendanceRate: attendance.rate,
    lessons: lessonRows,
    dynamics: {
      normalizedPoints,
      smoothed,
      trendSlope,
      trendPointCount: normalizedPoints.length,
    },
  };
}

async function loadCachedPupilAnalytics(
  pupilId: string,
  gradeId: string,
  period: ResolvedAnalyticsPeriod,
): Promise<PupilAnalyticsSnapshot> {
  "use cache";
  cacheTag(CACHE_TAGS.analyticsPupil(pupilId, period.academicYearId));
  cacheLife("minutes");
  const db = await getPrisma();
  return loadPupilAnalyticsFromDb(db, pupilId, gradeId, period);
}

function earliestCheckedDate(
  checks: { lessonId: string; homeworkChecked: boolean }[],
  lessons: { id: string; lessonDate: Date }[],
): string | null {
  let earliest: string | null = null;
  for (const check of checks) {
    if (!check.homeworkChecked) continue;
    const lesson = lessons.find((row) => row.id === check.lessonId);
    if (!lesson) continue;
    const iso = isoFromCalendarDate(lesson.lessonDate);
    if (!earliest || iso < earliest) earliest = iso;
  }
  return earliest;
}

export async function getPupilAnalytics(
  db: PrismaClient,
  actorUserId: string,
  pupilId: string,
  gradeId: string,
  rawPeriod: unknown,
): Promise<MutationResult<PupilAnalyticsSnapshot>> {
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
    const scope = await assertAnalyticsPupilAccess(
      tx,
      actorUserId,
      organizationId,
      pupilId,
      parsed.data.academicYearId,
    );
    if (isMutationErr(scope)) return scope;
    if (!scope.gradeIds.includes(gradeId)) {
      return {
        ok: false as const,
        code: MUTATION_ERROR_CODES.NOT_FOUND,
        message: "common.errors.not_found",
      };
    }
    return period;
  });
  if (isMutationErr(access)) return access;

  const data = await loadCachedPupilAnalytics(pupilId, gradeId, access);
  return { ok: true, data };
}
