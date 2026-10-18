import { describe, expect, it } from "vitest";
import { resolveAnalyticsPeriodBounds } from "./analytics-period";

describe("resolveAnalyticsPeriodBounds", () => {
  const yearStart = new Date(Date.UTC(2025, 8, 1));
  const yearEnd = new Date(Date.UTC(2026, 5, 30));

  it("returns full year bounds for year mode", () => {
    const result = resolveAnalyticsPeriodBounds(
      { mode: "year", academicYearId: "55555555-5555-4555-8555-555555555555" },
      yearStart,
      yearEnd,
    );
    expect(result.fromIso).toBe("2025-09-01");
    expect(result.toIso).toBe("2026-06-30");
  });

  it("returns empty intersecting month inside year (N: empty period)", () => {
    const result = resolveAnalyticsPeriodBounds(
      {
        mode: "month",
        academicYearId: "55555555-5555-4555-8555-555555555555",
        month: "2025-07",
      },
      yearStart,
      yearEnd,
    );
    expect(result.fromIso).toBe("2025-09-01");
    expect(result.toIso).toBe("2025-09-01");
  });
});
