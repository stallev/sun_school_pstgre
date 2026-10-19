import { describe, expect, it } from "vitest";
import { ACADEMIC_YEAR_STATUS } from "../constants/enums";
import { USER_ROLE } from "../constants/user-role";
import type { AcademicYearRef } from "./default-year";
import { filterVisibleYears } from "./visible-years";

const year = (id: string, startsOn: string): AcademicYearRef => ({
  id,
  status: ACADEMIC_YEAR_STATUS.CLOSED,
  startsOn,
});

describe("filterVisibleYears", () => {
  const allYears = [
    year("y2024", "2024-09-01"),
    year("y2025", "2025-09-01"),
    year("y2026", "2026-09-01"),
  ];

  it("returns all years for admin sorted by startsOn desc", () => {
    expect(
      filterVisibleYears({
        role: USER_ROLE.ADMIN,
        allYears,
        teacherAssignedYearIds: [],
      }).map((row) => row.id),
    ).toEqual(["y2026", "y2025", "y2024"]);
  });

  it("returns only assigned years for teacher", () => {
    expect(
      filterVisibleYears({
        role: USER_ROLE.TEACHER,
        allYears,
        teacherAssignedYearIds: ["y2025", "y2026"],
      }).map((row) => row.id),
    ).toEqual(["y2026", "y2025"]);
  });

  it("returns an empty list for other roles", () => {
    expect(
      filterVisibleYears({
        role: USER_ROLE.PARENT,
        allYears,
        teacherAssignedYearIds: ["y2025"],
      }),
    ).toEqual([]);
  });
});
