import { describe, expect, it } from "vitest";
import { ACADEMIC_YEAR_STATUS } from "../constants/enums";
import { MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import {
  canActivateYear,
  canCloseYear,
  validateYearDates,
  validateYearNoOverlap,
  yearRangesOverlap,
} from "./year";

const Y = ACADEMIC_YEAR_STATUS;

describe("validateYearDates", () => {
  it("accepts startsOn before endsOn", () => {
    expect(validateYearDates("2026-09-01", "2027-06-01")).toBeNull();
  });

  it("rejects equal or reversed dates", () => {
    expect(validateYearDates("2027-06-01", "2026-09-01")?.code).toBe(MUTATION_ERROR_CODES.VALIDATION);
    expect(validateYearDates("2026-09-01", "2026-09-01")?.code).toBe(MUTATION_ERROR_CODES.VALIDATION);
  });
});

describe("yearRangesOverlap", () => {
  it("detects intersection and touching ranges", () => {
    const a = { startsOn: "2026-09-01", endsOn: "2027-06-01" };
    const b = { startsOn: "2027-01-01", endsOn: "2027-12-31" };
    expect(yearRangesOverlap(a, b)).toBe(true);
    expect(yearRangesOverlap({ startsOn: "2025-01-01", endsOn: "2026-08-31" }, a)).toBe(false);
  });
});

describe("validateYearNoOverlap", () => {
  it("returns SCHOOL_YEAR_OVERLAP when ranges intersect", () => {
    const err = validateYearNoOverlap(
      { startsOn: "2026-09-01", endsOn: "2027-06-01" },
      [{ startsOn: "2027-01-01", endsOn: "2027-12-31" }],
    );
    expect(err?.code).toBe(MUTATION_ERROR_CODES.SCHOOL_YEAR_OVERLAP);
  });
});

describe("canActivateYear", () => {
  it("allows DRAFT without another ACTIVE year", () => {
    expect(canActivateYear({ yearStatus: Y.DRAFT, hasOtherActiveYear: false })).toBeNull();
  });

  it("rejects when another ACTIVE year exists", () => {
    expect(canActivateYear({ yearStatus: Y.DRAFT, hasOtherActiveYear: true })?.code).toBe(
      MUTATION_ERROR_CODES.SCHOOL_YEAR_ACTIVE_EXISTS,
    );
  });

  it("rejects non-DRAFT status", () => {
    expect(canActivateYear({ yearStatus: Y.ACTIVE, hasOtherActiveYear: false })?.code).toBe(
      MUTATION_ERROR_CODES.SCHOOL_YEAR_STATUS_INVALID,
    );
  });
});

describe("canCloseYear", () => {
  it("allows ACTIVE only", () => {
    expect(canCloseYear({ yearStatus: Y.ACTIVE })).toBeNull();
    expect(canCloseYear({ yearStatus: Y.DRAFT })?.code).toBe(MUTATION_ERROR_CODES.SCHOOL_YEAR_STATUS_INVALID);
  });
});
