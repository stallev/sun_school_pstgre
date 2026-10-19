import { describe, expect, it } from "vitest";
import { buildPupilYearNavSearchParams } from "./build-pupil-year-nav-query";

describe("buildPupilYearNavSearchParams", () => {
  it("clears month/from/to/gradeId when the pupil year changes", () => {
    const current = new URLSearchParams(
      "pupilYear=y1&metric=verses&month=2026-03&from=2026-01-01&to=2026-03-01&gradeId=g-foreign",
    );

    const next = buildPupilYearNavSearchParams(current, { pupilYear: "y2" }, true);

    expect(next.get("pupilYear")).toBe("y2");
    expect(next.get("metric")).toBe("verses");
    expect(next.get("month")).toBeNull();
    expect(next.get("from")).toBeNull();
    expect(next.get("to")).toBeNull();
    expect(next.get("gradeId")).toBeNull();
  });

  it("keeps period params when only the metric changes", () => {
    const current = new URLSearchParams("pupilYear=y1&month=2026-03&gradeId=g1");

    const next = buildPupilYearNavSearchParams(current, { metric: "test" }, false);

    expect(next.get("metric")).toBe("test");
    expect(next.get("month")).toBe("2026-03");
    expect(next.get("gradeId")).toBe("g1");
  });
});
