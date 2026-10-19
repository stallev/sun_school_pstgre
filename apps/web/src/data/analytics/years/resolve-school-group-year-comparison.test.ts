import { describe, expect, it } from "vitest";
import { resolveSchoolGroupYearComparison } from "./resolve-school-group-year-comparison";

const reliableTotals = {
  kids: 12,
  lessons: 8,
  attendance: 0.8,
  verses: 1.2,
  test: 7.5,
  notebook: 8.1,
};

describe("resolveSchoolGroupYearComparison", () => {
  it("marks comparison unreliable when thresholds are not met but previous year exists", () => {
    const sparse = { ...reliableTotals, kids: 2, lessons: 1 };
    const result = resolveSchoolGroupYearComparison(sparse, reliableTotals);

    expect(result.hasPreviousYear).toBe(true);
    expect(result.comparisonReliable).toBe(false);
    expect(result.diff).toBeNull();
  });

  it("computes diff when comparison is reliable", () => {
    const result = resolveSchoolGroupYearComparison(reliableTotals, {
      ...reliableTotals,
      attendance: 0.74,
    });

    expect(result.hasPreviousYear).toBe(true);
    expect(result.comparisonReliable).toBe(true);
    expect(result.diff?.attendance).toBe(6);
  });
});
