import { describe, expect, it } from "vitest";
import { findLessonTopScorerIds } from "./lesson-top-scorers";

const entry = (pupilId: string, total: number | string | null, homeworkChecked = true) => ({
  pupilId,
  homeworkChecked,
  total,
});

describe("findLessonTopScorerIds (check flow §5.2в)", () => {
  it("returns the single pupil with the highest total", () => {
    expect([...findLessonTopScorerIds([entry("a", 12), entry("b", 25), entry("c", 3)])]).toEqual(["b"]);
  });

  it("returns every pupil tied at the maximum", () => {
    expect([...findLessonTopScorerIds([entry("a", 25), entry("b", 19), entry("c", 25)])]).toEqual(["a", "c"]);
  });

  it("returns nothing when nobody scored above zero", () => {
    expect(findLessonTopScorerIds([entry("a", 0), entry("b", 0)]).size).toBe(0);
    expect(findLessonTopScorerIds([]).size).toBe(0);
  });

  it("ignores unchecked pupils and non-numeric totals", () => {
    const leaders = findLessonTopScorerIds([
      entry("a", 30, false),
      entry("b", "—"),
      entry("c", null),
      entry("d", 7),
    ]);
    expect([...leaders]).toEqual(["d"]);
  });

  it("follows a changed maximum after a score edit", () => {
    expect([...findLessonTopScorerIds([entry("a", 10), entry("b", 8)])]).toEqual(["a"]);
    expect([...findLessonTopScorerIds([entry("a", 10), entry("b", 11)])]).toEqual(["b"]);
  });
});
