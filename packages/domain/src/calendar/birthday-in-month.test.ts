import { describe, expect, it } from "vitest";
import { birthdayDayInMonth, birthdayEventDateIso } from "./birthday-in-month";

describe("birthdayDayInMonth", () => {
  it("returns the day when birth month matches", () => {
    expect(birthdayDayInMonth("2012-03-15", 2026, 3)).toBe(15);
  });

  it("returns null when birth month differs", () => {
    expect(birthdayDayInMonth("2012-04-10", 2026, 3)).toBeNull();
  });

  it("maps 29 February to 28 in a non-leap year", () => {
    expect(birthdayDayInMonth("2012-02-29", 2025, 2)).toBe(28);
    expect(birthdayEventDateIso("2012-02-29", 2025, 2)).toBe("2025-02-28");
  });

  it("keeps 29 February in a leap year", () => {
    expect(birthdayDayInMonth("2012-02-29", 2024, 2)).toBe(29);
    expect(birthdayEventDateIso("2012-02-29", 2024, 2)).toBe("2024-02-29");
  });
});
