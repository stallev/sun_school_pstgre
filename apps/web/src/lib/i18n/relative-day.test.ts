import { describe, expect, it } from "vitest";
import { calendarDayInTimeZone, formatRelativeCalendarDay } from "@/lib/i18n/relative-day";

const messages = {
  today: "today",
  yesterday: "yesterday",
  onDate: "on {date}",
};

describe("formatRelativeCalendarDay", () => {
  it("returns today in the school time zone", () => {
    const now = new Date("2026-11-04T15:00:00.000Z");
    expect(
      formatRelativeCalendarDay({
        instantIso: "2026-11-04T10:00:00.000Z",
        schoolTimeZone: "Europe/Moscow",
        locale: "ru",
        messages,
        now,
      }),
    ).toBe("today");
  });

  it("returns yesterday near midnight in the school zone", () => {
    const now = new Date("2026-11-04T02:00:00.000Z");
    expect(
      formatRelativeCalendarDay({
        instantIso: "2026-11-03T20:00:00.000Z",
        schoolTimeZone: "Europe/Moscow",
        locale: "ru",
        messages,
        now,
      }),
    ).toBe("yesterday");
  });

  it("formats older dates with onDate template", () => {
    const label = formatRelativeCalendarDay({
      instantIso: "2026-10-20T12:00:00.000Z",
      schoolTimeZone: "UTC",
      locale: "ru",
      messages,
      now: new Date("2026-11-04T12:00:00.000Z"),
    });
    expect(label).toMatch(/^on /);
  });
});

describe("calendarDayInTimeZone", () => {
  it("uses the provided IANA zone", () => {
    const instant = new Date("2026-11-04T23:30:00.000Z");
    expect(calendarDayInTimeZone(instant, "UTC")).toBe("2026-11-04");
    expect(calendarDayInTimeZone(instant, "Europe/Moscow")).toBe("2026-11-05");
  });
});
