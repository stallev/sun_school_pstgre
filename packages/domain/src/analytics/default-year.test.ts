import { describe, expect, it } from "vitest";
import { ACADEMIC_YEAR_STATUS } from "../constants/enums";
import { resolveDefaultYear, type AcademicYearRef } from "./default-year";

const year = (
  id: string,
  status: AcademicYearRef["status"],
  startsOn: string,
): AcademicYearRef => ({ id, status, startsOn });

describe("resolveDefaultYear", () => {
  it("prefers the active year when visible", () => {
    const result = resolveDefaultYear([
      year("closed", ACADEMIC_YEAR_STATUS.CLOSED, "2024-09-01"),
      year("active", ACADEMIC_YEAR_STATUS.ACTIVE, "2025-09-01"),
    ]);
    expect(result).toEqual({ kind: "year", yearId: "active" });
  });

  it("falls back to the latest closed year by startsOn", () => {
    const result = resolveDefaultYear([
      year("older", ACADEMIC_YEAR_STATUS.CLOSED, "2023-09-01"),
      year("newer", ACADEMIC_YEAR_STATUS.CLOSED, "2024-09-01"),
    ]);
    expect(result).toEqual({ kind: "year", yearId: "newer" });
  });

  it("returns none when no years are available", () => {
    expect(resolveDefaultYear([])).toEqual({ kind: "none" });
  });

  it("returns none when only draft years are visible", () => {
    expect(
      resolveDefaultYear([year("draft", ACADEMIC_YEAR_STATUS.DRAFT, "2026-09-01")]),
    ).toEqual({ kind: "none" });
  });
});
