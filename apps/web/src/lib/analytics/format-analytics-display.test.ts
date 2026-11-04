import { describe, expect, it } from "vitest";
import {
  formatAnalyticsAttendanceRate,
  formatAnalyticsDelta,
  formatAnalyticsPercent,
  formatYearComparisonDiff,
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

describe("formatAnalyticsDelta", () => {
  it("formats signed decimals with locale decimal separator (ADR-018 §4.3)", () => {
    expect(formatAnalyticsDelta(1.2, "ru")).toBe("+1,2");
    expect(formatAnalyticsDelta(1.2, "en")).toBe("+1.2");
    expect(formatAnalyticsDelta(-0.5, "ru")).toBe("−0,5");
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

describe("formatYearComparisonDiff", () => {
  const ruMessages = {
    diffHigher: "+{amount} к прошлому году",
    diffLower: "−{amount} к прошлому году",
    diffSame: "без изменений",
  };

  it("uses one template with metric-specific amount (R-23)", () => {
    expect(formatYearComparisonDiff("attendance", 1, ruMessages, "ru")).toBe(
      "+1% к прошлому году",
    );
    expect(formatYearComparisonDiff("verses", 0.1, ruMessages, "ru")).toBe(
      "+0,1 к прошлому году",
    );
    expect(formatYearComparisonDiff("test", 0, ruMessages, "ru")).toBe("без изменений");
    expect(formatYearComparisonDiff("notebook", -0.1, ruMessages, "ru")).toBe(
      "−0,1 к прошлому году",
    );
  });
});
