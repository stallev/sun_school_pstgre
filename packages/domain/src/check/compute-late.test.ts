import { describe, expect, it } from "vitest";
import { computeLate } from "./compute-late";

describe("computeLate", () => {
  const zone = "Europe/Moscow";

  it.each([
    {
      name: "before next lesson date",
      setAt: new Date("2026-09-14T20:59:00.000Z"),
      next: "2026-09-15",
      expected: false,
    },
    {
      name: "after next lesson date (midnight boundary)",
      setAt: new Date("2026-09-15T21:01:00.000Z"),
      next: "2026-09-15",
      expected: true,
    },
    {
      name: "equal dates",
      setAt: new Date("2026-09-15T12:00:00.000Z"),
      next: "2026-09-15",
      expected: false,
    },
    {
      name: "no next lesson",
      setAt: new Date("2026-09-15T12:00:00.000Z"),
      next: null,
      expected: false,
    },
  ])("$name", ({ setAt, next, expected }) => {
    expect(computeLate(setAt, next, zone)).toBe(expected);
  });

  it("uses school timezone for the calendar day (America/New_York DST)", () => {
    const setAt = new Date("2026-03-09T04:30:00.000Z");
    expect(computeLate(setAt, "2026-03-08", "America/New_York")).toBe(true);
    expect(computeLate(setAt, "2026-03-09", "America/New_York")).toBe(false);
  });

  it("calendar day depends on school timezone (stored late is not recomputed on zone change)", () => {
    const setAt = new Date("2026-09-14T14:00:00.000Z");
    const next = "2026-09-14";
    expect(computeLate(setAt, next, "Europe/Moscow")).toBe(false);
    expect(computeLate(setAt, next, "Pacific/Auckland")).toBe(true);
  });
});
