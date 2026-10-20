import { USER_ROLE, type UserRole } from "../constants/user-role";
import type { AcademicYearRef } from "./default-year";

export type FilterVisibleYearsInput = {
  role: UserRole;
  allYears: readonly AcademicYearRef[];
  /** Years where the teacher has `teacher_assignment` on the relevant group (AZ-48). */
  teacherAssignedYearIds: readonly string[];
};

const compareYearStartsDesc = (left: AcademicYearRef, right: AcademicYearRef): number =>
  right.startsOn.localeCompare(left.startsOn);

/** analytics_year_snapshots_contract §7 — teacher: assignment years; admin: all listed years. */
export const filterVisibleYears = (input: FilterVisibleYearsInput): AcademicYearRef[] => {
  if (input.role === USER_ROLE.ADMIN) {
    return [...input.allYears].sort(compareYearStartsDesc);
  }

  if (input.role === USER_ROLE.TEACHER) {
    const assigned = new Set(input.teacherAssignedYearIds);
    return input.allYears
      .filter((year) => assigned.has(year.id))
      .sort(compareYearStartsDesc);
  }

  return [];
};
