import { describe, expect, it } from "vitest";
import {
  ANALYTICS_COMPARISON_MIN_LESSONS,
  ANALYTICS_COMPARISON_MIN_PUPILS,
  computeYearDiff,
  isComparisonReliable,
} from "./year-comparison";
import type { YearMetricTotals } from "./year-totals";

const reliableTotals = (overrides: Partial<YearMetricTotals> = {}): YearMetricTotals => ({
  kids: ANALYTICS_COMPARISON_MIN_PUPILS,
  lessons: ANALYTICS_COMPARISON_MIN_LESSONS,
  attendance: 0.8,
  verses: 1.5,
  test: 7,
  notebook: 8,
  ...overrides,
});

describe("isComparisonReliable", () => {
  it("is true when both years meet N and M", () => {
    expect(isComparisonReliable(reliableTotals(), reliableTotals())).toBe(true);
  });

  it("is false when kids are below N in either year", () => {
    expect(
      isComparisonReliable(
        reliableTotals({ kids: ANALYTICS_COMPARISON_MIN_PUPILS - 1 }),
        reliableTotals(),
      ),
    ).toBe(false);
  });

  it("is false when lessons are below M in either year", () => {
    expect(
      isComparisonReliable(
        reliableTotals(),
        reliableTotals({ lessons: ANALYTICS_COMPARISON_MIN_LESSONS - 1 }),
      ),
    ).toBe(false);
  });
});

describe("computeYearDiff", () => {
  it("returns null without a previous year", () => {
    expect(computeYearDiff(reliableTotals(), null)).toBeNull();
  });

  it("returns null when comparison is not reliable", () => {
    expect(
      computeYearDiff(
        reliableTotals({ kids: 0 }),
        reliableTotals({ kids: ANALYTICS_COMPARISON_MIN_PUPILS }),
      ),
    ).toBeNull();
  });

  it("computes attendance in whole percentage points and other metrics to one decimal", () => {
    const current = reliableTotals({
      attendance: 0.805,
      verses: 2,
      test: 7.25,
      notebook: 8.04,
    });
    const previous = reliableTotals({
      attendance: 0.75,
      verses: 1.5,
      test: 7,
      notebook: 8,
    });

    expect(computeYearDiff(current, previous)).toEqual({
      attendance: 6,
      verses: 0.5,
      test: 0.3,
      notebook: 0,
    });
  });

  it("returns null metric diffs when values are NULL", () => {
    const diff = computeYearDiff(
      reliableTotals({ test: null }),
      reliableTotals({ test: 7 }),
    );
    expect(diff?.test).toBeNull();
  });
});
