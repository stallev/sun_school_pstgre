import { describe, expect, it } from "vitest";
import { MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import { countCalendarDaysBetween, validateExtendLegacyDeadline } from "./legacy-consent";

describe("legacy consent domain", () => {
  it("counts calendar days between ISO dates", () => {
    expect(countCalendarDaysBetween("2026-01-01", "2026-01-01")).toBe(0);
    expect(countCalendarDaysBetween("2026-01-01", "2026-03-02")).toBe(60);
  });

  it("requires an existing deadline before extend", () => {
    expect(validateExtendLegacyDeadline({ currentDeadlineOn: null, newDeadlineOn: "2026-12-31" })?.code).toBe(
      MUTATION_ERROR_CODES.VALIDATION,
    );
  });

  it("rejects new deadline that is not after the current one", () => {
    expect(
      validateExtendLegacyDeadline({
        currentDeadlineOn: "2026-06-01",
        newDeadlineOn: "2026-06-01",
      })?.code,
    ).toBe(MUTATION_ERROR_CODES.VALIDATION);
    expect(
      validateExtendLegacyDeadline({
        currentDeadlineOn: "2026-06-01",
        newDeadlineOn: "2026-05-01",
      })?.code,
    ).toBe(MUTATION_ERROR_CODES.VALIDATION);
  });

  it("allows a later deadline", () => {
    expect(
      validateExtendLegacyDeadline({
        currentDeadlineOn: "2026-06-01",
        newDeadlineOn: "2026-09-01",
      }),
    ).toBeNull();
  });
});
