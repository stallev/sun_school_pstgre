import { describe, expect, it } from "vitest";
import { LESSON_KIND } from "../constants/enums";
import { resolveVersesToRecite } from "./resolve-verses-to-recite";

const versesA = [
  { lessonVerseId: "v1", position: 1 },
  { lessonVerseId: "v2", position: 2 },
];

const lessons = [
  {
    id: "regular-1",
    kind: LESSON_KIND.REGULAR,
    lessonDate: "2026-09-01",
    createdAt: "2026-08-01T10:00:00.000Z",
    verses: versesA,
  },
  {
    id: "review",
    kind: LESSON_KIND.REVIEW,
    lessonDate: "2026-09-08",
    createdAt: "2026-08-01T11:00:00.000Z",
    verses: [],
  },
  {
    id: "regular-2",
    kind: LESSON_KIND.REGULAR,
    lessonDate: "2026-09-15",
    createdAt: "2026-08-01T12:00:00.000Z",
    verses: [{ lessonVerseId: "v3", position: 1 }],
  },
];

describe("resolveVersesToRecite", () => {
  it("returns verses from the previous regular lesson (БП-2)", () => {
    expect(resolveVersesToRecite(lessons, "regular-2")).toEqual(versesA);
    expect(resolveVersesToRecite(lessons, "review")).toEqual(versesA);
  });

  it("returns empty for the first regular lesson of the year", () => {
    expect(resolveVersesToRecite(lessons, "regular-1")).toEqual([]);
  });
});
