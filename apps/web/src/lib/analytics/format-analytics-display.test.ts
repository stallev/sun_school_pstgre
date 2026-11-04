import { describe, expect, it } from "vitest";
import { formatAnalyticsChartAxisTick } from "@/lib/analytics/format-analytics-display";

describe("formatAnalyticsChartAxisTick (R-23)", () => {
  it("formats attendance axis as percent", () => {
    expect(formatAnalyticsChartAxisTick("{value}%", 80, "ru", "percent")).toBe("80%");
  });

  it("formats score axis with decimal comma for ru", () => {
    expect(formatAnalyticsChartAxisTick("{value}%", 2.5, "ru", "score")).toBe("2,5");
  });
});
