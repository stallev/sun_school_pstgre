import "server-only";

import {
  SAMPLE_LAYER,
  type SampleLayer,
  averageRecitedVersesForLesson,
  averageReportScores,
  classifySampleLayer,
  collectReportAverageScores,
  computeAttendanceCounts,
  findFirstRegularLessonId,
  isMainSampleLayer,
  isVerseRecitationAnalyticsLesson,
  resolveSampleCountingStartDate,
  type ScoreAverageResult,
} from "@sunschool/domain";
import { type LessonKind } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { isoFromCalendarDate } from "../school/calendar-date";
import { isoFromEnrollmentStartsOn } from "../school/school-enrollment-shared.server";
import type { ResolvedAnalyticsPeriod } from "./analytics-period";
import { periodDateRange } from "./analytics-shared.server";

export type AnalyticsChartPoint = {
  lessonId: string;
  lessonDate: string;
  value: number | null;
  observationCount: number;
};

export type GroupAnalyticsPupilRow = {
  pupilId: string;
  displayName: string;
  birthYear: number | null;
  layer: SampleLayer;
  attendanceRate: number | null;
  checkedLessonCount: number;
  attendedLessonCount: number;
  versesAverage: ScoreAverageResult;
  testAverage: ScoreAverageResult;
  notebookAverage: ScoreAverageResult;
};

export type GroupAnalyticsSnapshot = {
  period: ResolvedAnalyticsPeriod;
  hasCheckedLessonsInPeriod: boolean;
  sampleCounts: Record<SampleLayer, number>;
  pupilsByLayer: Record<SampleLayer, GroupAnalyticsPupilRow[]>;
  kpi: {
    attendancePercent: number | null;
    versesAverage: ScoreAverageResult;
    testAverage: ScoreAverageResult;
    notebookAverage: ScoreAverageResult;
    layerAObservationCount: number;
  };
  charts: {
    attendance: AnalyticsChartPoint[];
    verses: AnalyticsChartPoint[];
    test: AnalyticsChartPoint[];
    notebook: AnalyticsChartPoint[];
  };
};

type LessonRow = {
  id: string;
  lessonDate: Date;
  kind: LessonKind;
  hasTest: boolean;
  ordinal: number;
  createdAt: Date;
};

type CheckRow = {
  lessonId: string;
  pupilId: string;
  present: boolean;
  homeworkChecked: boolean;
  late: boolean;
  testScore: number | null;
  notebookScore: number | null;
  verseScores: { score: number }[];
};

const emptyLayerMap = (): Record<SampleLayer, GroupAnalyticsPupilRow[]> => ({
  [SAMPLE_LAYER.A]: [],
  [SAMPLE_LAYER.B]: [],
  [SAMPLE_LAYER.C]: [],
  [SAMPLE_LAYER.D]: [],
});

const emptySampleCounts = (): Record<SampleLayer, number> => ({
  [SAMPLE_LAYER.A]: 0,
  [SAMPLE_LAYER.B]: 0,
  [SAMPLE_LAYER.C]: 0,
  [SAMPLE_LAYER.D]: 0,
});

export async function computeGroupAnalyticsSnapshot(
  db: PrismaClient,
  gradeId: string,
  period: ResolvedAnalyticsPeriod,
): Promise<GroupAnalyticsSnapshot> {
  const { gte, lte } = periodDateRange(period);
  const yearId = period.academicYearId;

  const enrollments = await db.enrollment.findMany({
    where: { gradeId, academicYearId: yearId },
    select: {
      pupilId: true,
      startsOn: true,
      pupil: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          middleName: true,
          birthDate: true,
          isActive: true,
        },
      },
    },
  });

  const lessons = await db.lesson.findMany({
    where: { gradeId, academicYearId: yearId },
    select: {
      id: true,
      lessonDate: true,
      kind: true,
      hasTest: true,
      ordinal: true,
      createdAt: true,
    },
    orderBy: [{ lessonDate: "asc" }, { ordinal: "asc" }],
  });

  const lessonIds = lessons.map((lesson) => lesson.id);
  const checks =
    lessonIds.length === 0
      ? []
      : await db.homeworkCheck.findMany({
          where: { lessonId: { in: lessonIds } },
          select: {
            lessonId: true,
            pupilId: true,
            present: true,
            homeworkChecked: true,
            late: true,
            testScore: true,
            notebookScore: true,
            verseScores: { select: { score: true } },
          },
        });

  const checksByLesson = new Map<string, CheckRow[]>();
  const checksByPupil = new Map<string, CheckRow[]>();
  for (const check of checks) {
    const lessonBucket = checksByLesson.get(check.lessonId) ?? [];
    lessonBucket.push(check);
    checksByLesson.set(check.lessonId, lessonBucket);

    const pupilBucket = checksByPupil.get(check.pupilId) ?? [];
    pupilBucket.push(check);
    checksByPupil.set(check.pupilId, pupilBucket);
  }

  const lessonIsChecked = (lessonId: string): boolean =>
    (checksByLesson.get(lessonId) ?? []).some((row) => row.homeworkChecked);

  const periodLessons = lessons.filter(
    (lesson) =>
      lesson.lessonDate >= gte &&
      lesson.lessonDate <= lte &&
      lessonIsChecked(lesson.id),
  );

  const firstRegularLessonId = findFirstRegularLessonId(
    lessons.map((lesson) => ({
      id: lesson.id,
      kind: lesson.kind as LessonKind,
      lessonDate: isoFromCalendarDate(lesson.lessonDate),
      createdAt: lesson.createdAt.toISOString(),
    })),
  );

  const pupilsByLayer = emptyLayerMap();
  const sampleCounts = emptySampleCounts();
  const layerAPupilIds = new Set<string>();

  for (const enrollment of enrollments) {
    const pupilId = enrollment.pupilId;
    const pupilChecks = checksByPupil.get(pupilId) ?? [];
    const countingStart = resolveSampleCountingStartDate(
      isoFromEnrollmentStartsOn(enrollment.startsOn),
      earliestCheckedLessonDate(pupilChecks, lessons),
    );

    const attendanceRows = lessons.map((lesson) => {
      const check = pupilChecks.find((row) => row.lessonId === lesson.id);
      const lessonDateIso = isoFromCalendarDate(lesson.lessonDate);
      return {
        lessonDate: lessonDateIso,
        isCheckedLesson: lessonIsChecked(lesson.id),
        hasPupilRecord: Boolean(check),
        present: check?.present ?? false,
        onOrAfterCountingStart: countingStart ? lessonDateIso >= countingStart : false,
      };
    });

    const attendance = computeAttendanceCounts(attendanceRows);
    const hasCheckedAfterStart = attendanceRows.some(
      (row) => row.onOrAfterCountingStart && row.isCheckedLesson && row.hasPupilRecord,
    );

    const layer = classifySampleLayer({
      pupilIsActive: enrollment.pupil.isActive,
      countingStartDate: countingStart,
      attendance,
      hasCheckedLessonAfterCountingStart: hasCheckedAfterStart,
    });

    const periodPupilChecks = pupilChecks.filter((row) => {
      const lesson = lessons.find((item) => item.id === row.lessonId);
      return lesson && lesson.lessonDate >= gte && lesson.lessonDate <= lte;
    });

    const row: GroupAnalyticsPupilRow = {
      pupilId,
      displayName: formatDisplayName(enrollment.pupil),
      birthYear: enrollment.pupil.birthDate
        ? enrollment.pupil.birthDate.getUTCFullYear()
        : null,
      layer,
      attendanceRate: attendance.rate,
      checkedLessonCount: attendance.checkedWithRecordCount,
      attendedLessonCount: attendance.presentCount,
      versesAverage: collectVerseAverage(periodPupilChecks, lessons, firstRegularLessonId),
      testAverage: collectReportAverageScores(
        periodPupilChecks.map((check) => ({
          present: check.present,
          submittedLate: check.late,
          score: check.testScore,
        })),
      ),
      notebookAverage: collectReportAverageScores(
        periodPupilChecks.map((check) => ({
          present: check.present,
          submittedLate: check.late,
          score: check.notebookScore,
        })),
      ),
    };

    pupilsByLayer[layer].push(row);
    sampleCounts[layer] += 1;
    if (isMainSampleLayer(layer)) {
      layerAPupilIds.add(pupilId);
    }
  }

  const charts = buildGroupCharts(periodLessons, checksByLesson, layerAPupilIds, firstRegularLessonId);

  const layerARows = pupilsByLayer[SAMPLE_LAYER.A];
  const kpiAttendance = averageReportScores(
    layerARows
      .map((row) => row.attendanceRate)
      .filter((rate): rate is number => rate !== null),
  );

  return {
    period,
    hasCheckedLessonsInPeriod: periodLessons.length > 0,
    sampleCounts,
    pupilsByLayer,
    kpi: {
      attendancePercent:
        kpiAttendance.average === null ? null : kpiAttendance.average * 100,
      versesAverage: averageLayerAverages(layerARows, (row) => row.versesAverage),
      testAverage: averageLayerAverages(layerARows, (row) => row.testAverage),
      notebookAverage: averageLayerAverages(layerARows, (row) => row.notebookAverage),
      layerAObservationCount: layerARows.length,
    },
    charts,
  };
}

function earliestCheckedLessonDate(
  pupilChecks: CheckRow[],
  lessons: LessonRow[],
): string | null {
  let earliest: string | null = null;
  for (const check of pupilChecks) {
    if (!check.homeworkChecked) continue;
    const lesson = lessons.find((row) => row.id === check.lessonId);
    if (!lesson) continue;
    const iso = isoFromCalendarDate(lesson.lessonDate);
    if (!earliest || iso < earliest) earliest = iso;
  }
  return earliest;
}

function collectVerseAverage(
  checks: CheckRow[],
  lessons: LessonRow[],
  firstRegularLessonId: string | null,
): ScoreAverageResult {
  const scores: number[] = [];
  for (const check of checks) {
    if (!check.homeworkChecked || !check.present) continue;
    const lesson = lessons.find((row) => row.id === check.lessonId);
    if (!lesson) continue;
    if (
      !isVerseRecitationAnalyticsLesson(
        {
          id: lesson.id,
          kind: lesson.kind as LessonKind,
          lessonDate: isoFromCalendarDate(lesson.lessonDate),
          createdAt: lesson.createdAt.toISOString(),
        },
        firstRegularLessonId,
      )
    ) {
      continue;
    }
    const recited = check.verseScores.filter((row) => row.score === 1 || row.score === 2).length;
    scores.push(recited);
  }
  return averageReportScores(scores);
}

function averageLayerAverages(
  rows: GroupAnalyticsPupilRow[],
  pick: (row: GroupAnalyticsPupilRow) => ScoreAverageResult,
): ScoreAverageResult {
  const values = rows
    .map((row) => pick(row))
    .filter((result) => result.average !== null)
    .map((result) => result.average as number);
  return averageReportScores(values);
}

function buildGroupCharts(
  periodLessons: LessonRow[],
  checksByLesson: Map<string, CheckRow[]>,
  layerAPupilIds: Set<string>,
  firstRegularLessonId: string | null,
): GroupAnalyticsSnapshot["charts"] {
  const attendance: AnalyticsChartPoint[] = [];
  const verses: AnalyticsChartPoint[] = [];
  const test: AnalyticsChartPoint[] = [];
  const notebook: AnalyticsChartPoint[] = [];

  for (const lesson of periodLessons) {
    const lessonChecks = (checksByLesson.get(lesson.id) ?? []).filter((row) =>
      layerAPupilIds.has(row.pupilId),
    );
    const lessonDate = isoFromCalendarDate(lesson.lessonDate);

    const presentCount = lessonChecks.filter((row) => row.present).length;
    const withRecord = lessonChecks.length;
    attendance.push({
      lessonId: lesson.id,
      lessonDate,
      value: withRecord === 0 ? null : (presentCount / withRecord) * 100,
      observationCount: withRecord,
    });

    const verseResult = averageRecitedVersesForLesson(
      lessonChecks.map((row) => ({
        lessonId: lesson.id,
        present: row.present,
        verseScores: row.verseScores.map((score) => score.score),
      })),
    );
    const verseEligible = isVerseRecitationAnalyticsLesson(
      {
        id: lesson.id,
        kind: lesson.kind as LessonKind,
        lessonDate,
        createdAt: lesson.createdAt.toISOString(),
      },
      firstRegularLessonId,
    );
    verses.push({
      lessonId: lesson.id,
      lessonDate,
      value: verseEligible ? verseResult.average : null,
      observationCount: verseEligible ? verseResult.observationCount : 0,
    });

    const testScores = lessonChecks
      .filter((row) => row.present || row.late)
      .map((row) => row.testScore)
      .filter((score): score is number => score !== null);
    const testResult = averageReportScores(testScores);
    test.push({
      lessonId: lesson.id,
      lessonDate,
      value: lesson.hasTest ? testResult.average : null,
      observationCount: lesson.hasTest ? testResult.observationCount : 0,
    });

    const notebookScores = lessonChecks
      .filter((row) => row.present || row.late)
      .map((row) => row.notebookScore)
      .filter((score): score is number => score !== null);
    const notebookResult = averageReportScores(notebookScores);
    notebook.push({
      lessonId: lesson.id,
      lessonDate,
      value: notebookResult.average,
      observationCount: notebookResult.observationCount,
    });
  }

  return { attendance, verses, test, notebook };
}
