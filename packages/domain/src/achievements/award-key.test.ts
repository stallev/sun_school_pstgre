import { describe, expect, it } from "vitest";
import { buildAchievementAwardKey } from "./award-key";

const base = {
  pupilId: "p1",
  achievementId: "a1",
  tier: 1,
  academicYearId: "y1",
};

describe("buildAchievementAwardKey", () => {
  it("keeps the existing format without an event date", () => {
    expect(buildAchievementAwardKey(base)).toBe("p1:a1:1:y1");
  });

  it("appends the event date for repeatable events", () => {
    expect(buildAchievementAwardKey({ ...base, eventOn: "2026-10-04" })).toBe("p1:a1:1:y1:2026-10-04");
  });

  it("gives different keys for different event dates", () => {
    expect(buildAchievementAwardKey({ ...base, eventOn: "2026-10-04" })).not.toBe(
      buildAchievementAwardKey({ ...base, eventOn: "2026-10-11" }),
    );
  });

  it("does not collide with the dateless key", () => {
    expect(buildAchievementAwardKey({ ...base, eventOn: "2026-10-04" })).not.toBe(
      buildAchievementAwardKey(base),
    );
  });
});
