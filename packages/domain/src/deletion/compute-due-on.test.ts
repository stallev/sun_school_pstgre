import { describe, expect, it } from "vitest";
import { DELETION_DUE_CALENDAR_DAYS } from "./constants";
import { computeDueOn } from "./compute-due-on";

describe("computeDueOn (deletion_requests §4, УД-5)", () => {
  it("adds 15 calendar days in the school time zone", () => {
    const createdAt = new Date("2026-03-10T22:00:00.000Z");
    expect(computeDueOn(createdAt, "Europe/Moscow")).toBe("2026-03-26");
  });

  it("rolls month boundaries", () => {
    const createdAt = new Date("2026-01-20T12:00:00.000Z");
    expect(computeDueOn(createdAt, "UTC")).toBe("2026-02-04");
  });

  it("uses the configured due window length", () => {
    expect(DELETION_DUE_CALENDAR_DAYS).toBe(15);
  });
});
