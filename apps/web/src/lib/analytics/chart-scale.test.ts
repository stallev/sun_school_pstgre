import { describe, expect, it } from "vitest";
import {
  computeVersesChartScale,
  formatAnalyticsAxisNumber,
  PERCENT_CHART_SCALE,
  SCORE_0_10_CHART_SCALE,
} from "@/lib/analytics/chart-scale";

describe("computeVersesChartScale", () => {
  it("starts at zero with 0.5 steps", () => {
    const scale = computeVersesChartScale([1.5, 1.65, 1.8, 1.95, 2.1]);
    expect(scale.domain[0]).toBe(0);
    expect(scale.ticks).toEqual([0, 0.5, 1, 1.5, 2, 2.5]);
  });

  it("does not collapse when all values are equal", () => {
    const scale = computeVersesChartScale([1.5, 1.5]);
    expect(scale.domain[0]).toBe(0);
    expect(scale.domain[1]).toBeGreaterThanOrEqual(1.5);
    expect(scale.ticks[0]).toBe(0);
  });

  it("handles a single observation", () => {
    const scale = computeVersesChartScale([0.8]);
    expect(scale.domain).toEqual([0, 1]);
    expect(scale.ticks).toEqual([0, 0.5, 1]);
  });
});

describe("fixed chart scales", () => {
  it("keeps attendance at 0–100", () => {
    expect(PERCENT_CHART_SCALE.domain).toEqual([0, 100]);
  });

  it("keeps score charts at 0–10", () => {
    expect(SCORE_0_10_CHART_SCALE.ticks).toEqual([0, 5, 10]);
  });

  it("formats ru decimals with a comma, not a dot", () => {
    expect(formatAnalyticsAxisNumber(1.5, "ru")).toBe("1,5");
    expect(formatAnalyticsAxisNumber(1.5, "ru")).not.toContain(".");
  });
});
