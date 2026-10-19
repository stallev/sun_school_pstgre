import { describe, expect, it } from "vitest";
import {
  resolveBackToGroupGradeId,
  resolvePupilYearAnalyticsGrade,
} from "./resolve-pupil-year-grade";

describe("resolvePupilYearAnalyticsGrade (AZ-50)", () => {
  it("picks teacher-assigned enrollment grade, not the last foreign enrollment", () => {
    const result = resolvePupilYearAnalyticsGrade({
      isAdmin: false,
      yearGradeIds: ["foreign", "own"],
      enrollmentGradeIdsOrdered: ["foreign", "own"],
      teacherAssignedGradeIds: ["own"],
    });

    expect(result).toEqual({ mode: "analytics", gradeId: "own" });
  });

  it("honours requested gradeId when teacher is assigned to that group in the year", () => {
    const result = resolvePupilYearAnalyticsGrade({
      isAdmin: false,
      yearGradeIds: ["g1", "g2"],
      enrollmentGradeIdsOrdered: ["g1", "g2"],
      teacherAssignedGradeIds: ["g1", "g2"],
      requestedGradeId: "g1",
    });

    expect(result).toEqual({ mode: "analytics", gradeId: "g1" });
  });

  it("returns foreign_snapshot_only when the year has only foreign groups for the teacher (AZ-49)", () => {
    const result = resolvePupilYearAnalyticsGrade({
      isAdmin: false,
      yearGradeIds: ["foreign"],
      enrollmentGradeIdsOrdered: ["foreign"],
      teacherAssignedGradeIds: [],
    });

    expect(result).toEqual({ mode: "foreign_snapshot_only" });
  });

  it("allows admin to use any enrollment grade in the year", () => {
    const result = resolvePupilYearAnalyticsGrade({
      isAdmin: true,
      yearGradeIds: ["g1"],
      enrollmentGradeIdsOrdered: ["g1"],
      teacherAssignedGradeIds: [],
      requestedGradeId: "g1",
    });

    expect(result).toEqual({ mode: "analytics", gradeId: "g1" });
  });
});

describe("resolveBackToGroupGradeId (AZ-50)", () => {
  it("returns the first assigned grade across pupil years, skipping foreign-only years", () => {
    const gradeId = resolveBackToGroupGradeId(
      [
        { yearId: "y-closed-foreign", gradeIds: ["foreign"] },
        { yearId: "y-active", gradeIds: ["own"] },
      ],
      new Map([
        ["y-closed-foreign", []],
        ["y-active", ["own"]],
      ]),
    );

    expect(gradeId).toBe("own");
  });
});
