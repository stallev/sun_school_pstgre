import { describe, expect, it } from "vitest";
import {
  formatAnalyticsAttendanceRate,
  formatAnalyticsPercent,
} from "./format-analytics-display";

describe("formatAnalyticsPercent", () => {
  const template = "{value}%";

  it("maps a 0–1 rate to a whole percent", () => {
    expect(formatAnalyticsPercent(template, 1)).toBe("100%");
    expect(formatAnalyticsPercent(template, 0.8)).toBe("80%");
    expect(formatAnalyticsPercent(template, 0.5)).toBe("50%");
    expect(formatAnalyticsPercent(template, 0.256)).toBe("26%");
    expect(formatAnalyticsPercent(template, 0)).toBe("0%");
  });
});

describe("formatAnalyticsAttendanceRate", () => {
  const template = "{value}%";
  const empty = "—";

  it("returns empty for null and NaN", () => {
    expect(formatAnalyticsAttendanceRate(template, null, empty)).toBe(empty);
    expect(formatAnalyticsAttendanceRate(template, Number.NaN, empty)).toBe(empty);
  });
});
