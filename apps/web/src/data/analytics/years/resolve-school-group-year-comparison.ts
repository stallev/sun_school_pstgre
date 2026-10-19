import {
  computeYearDiff,
  isComparisonReliable,
  type GroupYearTotals,
  type YearMetricDiff,
} from "@sunschool/domain";

export type SchoolGroupYearComparison = {
  hasPreviousYear: boolean;
  comparisonReliable: boolean;
  diff: YearMetricDiff | null;
};

export const resolveSchoolGroupYearComparison = (
  current: GroupYearTotals | null,
  previous: GroupYearTotals | null,
): SchoolGroupYearComparison => {
  const hasPreviousYear = current !== null && previous !== null;
  const comparisonReliable =
    hasPreviousYear && isComparisonReliable(current, previous);
  const diff =
    comparisonReliable && current && previous
      ? computeYearDiff(current, previous)
      : null;

  return { hasPreviousYear, comparisonReliable, diff };
};
