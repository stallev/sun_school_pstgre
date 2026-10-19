import { averageReportScores } from "./averages";

export type YearMetricTotals = {
  kids: number;
  lessons: number;
  attendance: number | null;
  verses: number | null;
  test: number | null;
  notebook: number | null;
};

export type GroupYearTotals = YearMetricTotals;

export type PupilYearTotals = {
  lessons: number;
  attendance: number | null;
  verses: number | null;
  test: number | null;
  notebook: number | null;
  bricksEarned: number;
};

export type GroupYearTotalsLayerAPupil = {
  attendanceRate: number | null;
  versesAverage: number | null;
  testAverage: number | null;
  notebookAverage: number | null;
};

export type ComputeGroupYearTotalsInput = {
  checkedLessonCount: number;
  layerAPupils: readonly GroupYearTotalsLayerAPupil[];
};

export type ComputePupilYearTotalsInput = {
  checkedLessonCount: number;
  attendanceRate: number | null;
  versesAverage: number | null;
  testAverage: number | null;
  notebookAverage: number | null;
  bricksEarned: number;
};

const averagePersonalAverages = (
  values: readonly (number | null)[],
): number | null => {
  const result = averageReportScores(
    values.filter((value): value is number => value !== null),
  );
  return result.average;
};

const emptyGroupMetrics = (kids: number, lessons: number): GroupYearTotals => ({
  kids,
  lessons,
  attendance: null,
  verses: null,
  test: null,
  notebook: null,
});

/** Group year KPI row — same aggregation as P05 layer-A KPI for a full academic year. */
export const computeGroupYearTotals = (input: ComputeGroupYearTotalsInput): GroupYearTotals => {
  const kids = input.layerAPupils.length;
  const lessons = input.checkedLessonCount;

  if (kids === 0) {
    return emptyGroupMetrics(0, lessons);
  }

  const attendance = averageReportScores(
    input.layerAPupils
      .map((pupil) => pupil.attendanceRate)
      .filter((rate): rate is number => rate !== null),
  );

  return {
    kids,
    lessons,
    attendance: attendance.average,
    verses: averagePersonalAverages(input.layerAPupils.map((pupil) => pupil.versesAverage)),
    test: averagePersonalAverages(input.layerAPupils.map((pupil) => pupil.testAverage)),
    notebook: averagePersonalAverages(input.layerAPupils.map((pupil) => pupil.notebookAverage)),
  };
};

/** Pupil year row — personal metrics; NULL when no checked lessons (§4.2). */
export const computePupilYearTotals = (input: ComputePupilYearTotalsInput): PupilYearTotals => {
  const lessons = input.checkedLessonCount;

  if (lessons === 0) {
    return {
      lessons,
      attendance: null,
      verses: null,
      test: null,
      notebook: null,
      bricksEarned: input.bricksEarned,
    };
  }

  return {
    lessons,
    attendance: input.attendanceRate,
    verses: input.versesAverage,
    test: input.testAverage,
    notebook: input.notebookAverage,
    bricksEarned: input.bricksEarned,
  };
};

export type ComputeYearTotalsInput =
  | { scope: "group"; data: ComputeGroupYearTotalsInput }
  | { scope: "pupil"; data: ComputePupilYearTotalsInput };

/** Dispatches to group or pupil year totals (P05 formulas). */
export const computeYearTotals = (
  input: ComputeYearTotalsInput,
): GroupYearTotals | PupilYearTotals => {
  if (input.scope === "group") {
    return computeGroupYearTotals(input.data);
  }
  return computePupilYearTotals(input.data);
};

/** Pupil rows use lessons as the reliability denominator (kids = 1). */
export const pupilTotalsAsComparisonMetrics = (
  totals: PupilYearTotals,
): YearMetricTotals => ({
  kids: 1,
  lessons: totals.lessons,
  attendance: totals.attendance,
  verses: totals.verses,
  test: totals.test,
  notebook: totals.notebook,
});
