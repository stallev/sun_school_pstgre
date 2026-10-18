import { describe, expect, it } from "vitest";
import { computeTrend, leastSquaresSlope, TREND_LABEL } from "./trend";

describe("leastSquaresSlope", () => {
  it("detects upward trend", () => {
    expect(leastSquaresSlope([50, 55, 60, 65])).toBeGreaterThan(1);
  });
});

describe("computeTrend", () => {
  it.each([
    {
      name: "insufficient points",
      values: [70, 72, 71],
      label: TREND_LABEL.INSUFFICIENT_DATA,
    },
    {
      name: "growing",
      values: [50, 55, 60, 65, 70, 75],
      label: TREND_LABEL.GROWING,
    },
    {
      name: "declining",
      values: [80, 75, 70, 65, 60, 55],
      label: TREND_LABEL.DECLINING,
    },
    {
      name: "stable",
      values: [70, 71, 69, 70, 71, 70],
      label: TREND_LABEL.STABLE,
    },
  ])("$name", ({ values, label }) => {
    expect(computeTrend(values).label).toBe(label);
  });
});
