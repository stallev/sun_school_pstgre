import { ACADEMIC_YEAR_STATUS, type AcademicYearStatus } from "../constants/enums";

export type AcademicYearRef = {
  id: string;
  status: AcademicYearStatus;
  /** ISO calendar date — used to pick the latest closed year. */
  startsOn: string;
};

export type DefaultYearResult =
  | { kind: "year"; yearId: string }
  | { kind: "none" };

const compareYearStartsDesc = (left: AcademicYearRef, right: AcademicYearRef): number =>
  right.startsOn.localeCompare(left.startsOn);

/** analytics_year_snapshots_contract §6.5 — among already visibility-filtered years. */
export const resolveDefaultYear = (
  visibleYears: readonly AcademicYearRef[],
): DefaultYearResult => {
  if (visibleYears.length === 0) {
    return { kind: "none" };
  }

  const activeYear = visibleYears.find(
    (year) => year.status === ACADEMIC_YEAR_STATUS.ACTIVE,
  );
  if (activeYear) {
    return { kind: "year", yearId: activeYear.id };
  }

  const closedYears = visibleYears
    .filter((year) => year.status === ACADEMIC_YEAR_STATUS.CLOSED)
    .sort(compareYearStartsDesc);

  const latestClosed = closedYears[0];
  if (latestClosed) {
    return { kind: "year", yearId: latestClosed.id };
  }

  return { kind: "none" };
};
