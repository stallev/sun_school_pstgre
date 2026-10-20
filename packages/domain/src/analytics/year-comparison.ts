import type { YearMetricTotals } from "./year-totals";

/** analytics_year_snapshots_contract §5 (N). */
export const ANALYTICS_COMPARISON_MIN_PUPILS = 10;

/** analytics_year_snapshots_contract §5 (M). */
export const ANALYTICS_COMPARISON_MIN_LESSONS = 4;

export type YearMetricDiff = {
  attendance: number | null;
  verses: number | null;
  test: number | null;
  notebook: number | null;
};

const roundToOneDecimal = (value: number): number => Math.round(value * 10) / 10;

const diffNullableMetrics = (
  current: number | null,
  previous: number | null,
): number | null => {
  if (current === null || previous === null) {
    return null;
  }
  return roundToOneDecimal(current - previous);
};

/** INV-27 — both years must meet N/M on kids and lessons (group row or pupil lessons for pupil scope). */
export const isComparisonReliable = (
  current: Pick<YearMetricTotals, "kids" | "lessons">,
  previous: Pick<YearMetricTotals, "kids" | "lessons">,
): boolean =>
  current.kids >= ANALYTICS_COMPARISON_MIN_PUPILS &&
  previous.kids >= ANALYTICS_COMPARISON_MIN_PUPILS &&
  current.lessons >= ANALYTICS_COMPARISON_MIN_LESSONS &&
  previous.lessons >= ANALYTICS_COMPARISON_MIN_LESSONS;

/**
 * analytics_year_snapshots_contract §6.6 — attendance in whole percentage points;
 * verses, test, notebook with one decimal. Returns null when comparison is not reliable.
 */
export const computeYearDiff = (
  current: YearMetricTotals,
  previous: YearMetricTotals | null,
): YearMetricDiff | null => {
  if (!previous || !isComparisonReliable(current, previous)) {
    return null;
  }

  const attendanceDiff =
    current.attendance === null || previous.attendance === null
      ? null
      : Math.round((current.attendance - previous.attendance) * 100);

  return {
    attendance: attendanceDiff,
    verses: diffNullableMetrics(current.verses, previous.verses),
    test: diffNullableMetrics(current.test, previous.test),
    notebook: diffNullableMetrics(current.notebook, previous.notebook),
  };
};
