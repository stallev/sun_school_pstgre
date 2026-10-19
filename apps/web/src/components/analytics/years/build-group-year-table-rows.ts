import { isComparisonReliable } from "@sunschool/domain";
import type { GroupYearTotalRow } from "@/data/analytics/years/list-group-year-totals";
import type { YearTotalsTableRow } from "./YearTotalsTable";

export const buildGroupYearTableRows = (
  rows: readonly GroupYearTotalRow[],
): YearTotalsTableRow[] => {
  const chronological = [...rows].sort((left, right) =>
    left.yearName.localeCompare(right.yearName, undefined, { numeric: true }),
  );

  return rows.map((row) => {
    const index = chronological.findIndex((item) => item.yearId === row.yearId);
    const hasPreviousYear = index > 0;
    const previous = hasPreviousYear ? chronological[index - 1] : undefined;
    const comparisonReliable =
      hasPreviousYear && row.totals && previous?.totals
        ? isComparisonReliable(row.totals, previous.totals)
        : false;

    return {
      yearId: row.yearId,
      yearName: row.yearName,
      status: row.status,
      methodologyVersion: row.methodologyVersion,
      totals: row.totals,
      diff: row.diff,
      hasPreviousYear,
      comparisonReliable,
      previousYearName: previous?.yearName,
    };
  });
};
