import {
  SAMPLE_LAYER,
  averageReportScores,
  collectReportAverageScores,
  computeAttendanceCounts,
  computeGroupYearTotals,
  computePupilYearTotals,
  findFirstRegularLessonId,
  isVerseRecitationAnalyticsLesson,
  resolveSampleCountingStartDate,
  type AnalyticsSnapshotReason,
  type GroupYearTotals,
  type LessonKind,
  type PupilYearTotals,
} from "@sunschool/domain";
import { Prisma, type PrismaClient } from "../generated/prisma/client";
import { isoFromCalendarDate } from "../dates/calendar-date";
import { computeGroupAnalyticsSnapshot } from "./group-analytics-snapshot";
import type { ResolvedAnalyticsPeriod } from "./analytics-period";
import { loadBricksEarnedAndIssued } from "./bricks-earned-issued";

const isoFromEnrollmentStartsOn = (startsOn: Date): string => isoFromCalendarDate(startsOn);

type Tx = Prisma.TransactionClient;

export type PupilYearSnapshotMetrics = PupilYearTotals & { gradeIds: string[] };

async function countCheckedLessonsForGradeYear(
  tx: Tx,
  gradeId: string,
  yearId: string,
  excludePupilId?: string,
): Promise<number> {
  return tx.lesson.count({
    where: {
      gradeId,
      academicYearId: yearId,
      checks: {
        some: {
          homeworkChecked: true,
          ...(excludePupilId ? { pupilId: { not: excludePupilId } } : {}),
        },
      },
    },
  });
}

export type ComputeGroupYearSnapshotOptions = {
  excludePupilId?: string;
};

export async function computeGroupYearSnapshotMetrics(
  tx: Tx,
  gradeId: string,
  yearId: string,
  options?: ComputeGroupYearSnapshotOptions,
): Promise<GroupYearTotals> {
  const year = await tx.academicYear.findUniqueOrThrow({
    where: { id: yearId },
    select: { startsOn: true, endsOn: true },
  });
  const period: ResolvedAnalyticsPeriod = {
    academicYearId: yearId,
    fromIso: isoFromCalendarDate(year.startsOn),
    toIso: isoFromCalendarDate(year.endsOn),
  };

  const snapshot = await computeGroupAnalyticsSnapshot(tx as PrismaClient, gradeId, period, {
    excludePupilId: options?.excludePupilId,
  });
  const layerARows = snapshot.pupilsByLayer[SAMPLE_LAYER.A];
  const checkedLessonCount = await countCheckedLessonsForGradeYear(
    tx,
    gradeId,
    yearId,
    options?.excludePupilId,
  );

  return computeGroupYearTotals({
    checkedLessonCount,
    layerAPupils: layerARows.map((row) => ({
      attendanceRate: row.attendanceRate,
      versesAverage: row.versesAverage.average,
      testAverage: row.testAverage.average,
      notebookAverage: row.notebookAverage.average,
    })),
  });
}

type LessonRow = {
  id: string;
  gradeId: string;
  lessonDate: Date;
  kind: LessonKind;
  hasTest: boolean;
  ordinal: number;
  createdAt: Date;
};

type CheckRow = {
  lessonId: string;
  present: boolean;
  homeworkChecked: boolean;
  late: boolean;
  testScore: number | null;
  notebookScore: number | null;
  verseScores: { score: number }[];
};

function firstRegularLessonIdForGrade(lessons: LessonRow[], gradeId: string): string | null {
  const gradeLessons = lessons.filter((lesson) => lesson.gradeId === gradeId);
  return findFirstRegularLessonId(
    gradeLessons.map((lesson) => ({
      id: lesson.id,
      kind: lesson.kind,
      lessonDate: isoFromCalendarDate(lesson.lessonDate),
      createdAt: lesson.createdAt.toISOString(),
    })),
  );
}

function isEnrolledOnLessonDate(
  enrollments: { gradeId: string; startsOn: Date; endsOn: Date | null }[],
  gradeId: string,
  lessonDateIso: string,
  yearEndIso: string,
): boolean {
  for (const enrollment of enrollments) {
    if (enrollment.gradeId !== gradeId) continue;
    const startIso = isoFromEnrollmentStartsOn(enrollment.startsOn);
    const endIso = enrollment.endsOn ? isoFromCalendarDate(enrollment.endsOn) : yearEndIso;
    if (lessonDateIso >= startIso && lessonDateIso <= endIso) return true;
  }
  return false;
}

function earliestCheckedLessonDate(
  checks: CheckRow[],
  lessons: LessonRow[],
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

export async function computePupilYearSnapshotMetrics(
  tx: Tx,
  pupilId: string,
  yearId: string,
): Promise<PupilYearSnapshotMetrics | null> {
  const enrollments = await tx.enrollment.findMany({
    where: { pupilId, academicYearId: yearId },
    orderBy: { startsOn: "asc" },
    select: { gradeId: true, startsOn: true, endsOn: true },
  });
  const firstEnrollment = enrollments[0];
  if (!firstEnrollment) return null;

  const gradeIds = enrollments.map((row) => row.gradeId);
  const year = await tx.academicYear.findUniqueOrThrow({
    where: { id: yearId },
    select: { endsOn: true },
  });
  const yearEndIso = isoFromCalendarDate(year.endsOn);

  const lessons = await tx.lesson.findMany({
    where: { academicYearId: yearId, gradeId: { in: gradeIds } },
    select: {
      id: true,
      gradeId: true,
      lessonDate: true,
      kind: true,
      hasTest: true,
      ordinal: true,
      createdAt: true,
    },
    orderBy: [{ lessonDate: "asc" }, { ordinal: "asc" }],
  });

  const lessonIds = lessons.map((lesson) => lesson.id);
  const checks: CheckRow[] =
    lessonIds.length === 0
      ? []
      : await tx.homeworkCheck.findMany({
          where: { pupilId, lessonId: { in: lessonIds } },
          select: {
            lessonId: true,
            present: true,
            homeworkChecked: true,
            late: true,
            testScore: true,
            notebookScore: true,
            verseScores: { select: { score: true } },
          },
        });

  const lessonIsChecked = (lessonId: string): boolean =>
    checks.some((row) => row.lessonId === lessonId && row.homeworkChecked);

  const countingStart = resolveSampleCountingStartDate(
    isoFromEnrollmentStartsOn(firstEnrollment.startsOn),
    earliestCheckedLessonDate(checks, lessons),
  );

  const attendanceRows = lessons.map((lesson) => {
    const lessonDateIso = isoFromCalendarDate(lesson.lessonDate);
    const enrolled = isEnrolledOnLessonDate(enrollments, lesson.gradeId, lessonDateIso, yearEndIso);
    const check = checks.find((row) => row.lessonId === lesson.id);
    return {
      lessonDate: lessonDateIso,
      isCheckedLesson: lessonIsChecked(lesson.id),
      hasPupilRecord: enrolled && Boolean(check),
      present: check?.present ?? false,
      onOrAfterCountingStart: countingStart ? lessonDateIso >= countingStart : false,
    };
  });

  const attendance = computeAttendanceCounts(attendanceRows);

  const firstRegularByGrade = new Map<string, string | null>();
  for (const gradeId of gradeIds) {
    firstRegularByGrade.set(gradeId, firstRegularLessonIdForGrade(lessons, gradeId));
  }

  const verseScores: number[] = [];
  const reportRows: { present: boolean; submittedLate: boolean; score: number | null }[] = [];
  const notebookRows: { present: boolean; submittedLate: boolean; score: number | null }[] = [];

  for (const check of checks) {
    if (!check.homeworkChecked) continue;
    const lesson = lessons.find((row) => row.id === check.lessonId);
    if (!lesson) continue;
    const lessonDateIso = isoFromCalendarDate(lesson.lessonDate);
    if (!isEnrolledOnLessonDate(enrollments, lesson.gradeId, lessonDateIso, yearEndIso)) continue;

    if (
      check.present &&
      isVerseRecitationAnalyticsLesson(
        {
          id: lesson.id,
          kind: lesson.kind,
          lessonDate: lessonDateIso,
          createdAt: lesson.createdAt.toISOString(),
        },
        firstRegularByGrade.get(lesson.gradeId) ?? null,
      )
    ) {
      const recited = check.verseScores.filter((row) => row.score === 1 || row.score === 2).length;
      verseScores.push(recited);
    }

    reportRows.push({
      present: check.present,
      submittedLate: check.late,
      score: check.testScore,
    });
    notebookRows.push({
      present: check.present,
      submittedLate: check.late,
      score: check.notebookScore,
    });
  }

  const versesAverage = averageReportScores(verseScores);
  const testAverage = collectReportAverageScores(reportRows);
  const notebookAverage = collectReportAverageScores(notebookRows);
  const bricks = await loadBricksEarnedAndIssued(tx, pupilId, yearId);

  const totals = computePupilYearTotals({
    checkedLessonCount: attendance.checkedWithRecordCount,
    attendanceRate: attendance.rate,
    versesAverage: versesAverage.average,
    testAverage: testAverage.average,
    notebookAverage: notebookAverage.average,
    bricksEarned: bricks.earned,
  });

  return { ...totals, gradeIds };
}

export function metricsToGroupSnapshotRow(
  totals: GroupYearTotals,
  methodologyVersion: string,
  reason: AnalyticsSnapshotReason,
): Omit<Prisma.AnalyticsGroupYearSnapshotCreateInput, "grade" | "academicYear"> {
  return {
    kids: totals.kids,
    lessons: totals.lessons,
    attendance: totals.attendance === null ? null : new Prisma.Decimal(totals.attendance),
    verses: totals.verses === null ? null : new Prisma.Decimal(totals.verses),
    test: totals.test === null ? null : new Prisma.Decimal(totals.test),
    notebook: totals.notebook === null ? null : new Prisma.Decimal(totals.notebook),
    methodologyVersion,
    reason,
    version: 1,
  };
}

export function metricsToPupilSnapshotRow(
  metrics: PupilYearSnapshotMetrics,
  methodologyVersion: string,
  reason: AnalyticsSnapshotReason,
): Omit<Prisma.AnalyticsPupilYearSnapshotCreateInput, "pupil" | "academicYear"> {
  return {
    gradeIds: metrics.gradeIds,
    lessons: metrics.lessons,
    attendance: metrics.attendance === null ? null : new Prisma.Decimal(metrics.attendance),
    verses: metrics.verses === null ? null : new Prisma.Decimal(metrics.verses),
    test: metrics.test === null ? null : new Prisma.Decimal(metrics.test),
    notebook: metrics.notebook === null ? null : new Prisma.Decimal(metrics.notebook),
    bricksEarned: metrics.bricksEarned,
    methodologyVersion,
    reason,
    version: 1,
  };
}
