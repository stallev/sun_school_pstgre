import { describe, expect, it } from "vitest";
import { getCalendarWeekPeriodEnd, getCalendarWeekPeriodStart } from "./calendar-week-period";

describe("getCalendarWeekPeriodStart (families §6.6)", () => {
  it("returns Monday of the week in the school time zone", () => {
    const instant = new Date("2026-10-23T10:00:00.000Z");
    expect(getCalendarWeekPeriodStart(instant, "Europe/Moscow")).toBe("2026-10-19");
    expect(getCalendarWeekPeriodEnd("2026-10-19")).toBe("2026-10-25");
  });
});
