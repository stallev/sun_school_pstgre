import { describe, expect, it } from "vitest";
import { LESSON_KIND } from "../constants/enums";
import { resolveVersesToRecite } from "./resolve-verses-to-recite";

const verses = [
  { lessonVerseId: "v1", position: 1 },
  { lessonVerseId: "v2", position: 2 },
];

describe("resolveVersesToRecite", () => {
  it("returns the verses of the regular lesson itself (БП-2)", () => {
    expect(resolveVersesToRecite({ kind: LESSON_KIND.REGULAR, verses })).toEqual(verses);
  });

  it("returns empty for a regular lesson without verses", () => {
    expect(resolveVersesToRecite({ kind: LESSON_KIND.REGULAR, verses: [] })).toEqual([]);
  });

  it("returns empty for a review lesson", () => {
    expect(resolveVersesToRecite({ kind: LESSON_KIND.REVIEW, verses })).toEqual([]);
  });
});
