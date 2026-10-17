import { describe, expect, it } from "vitest";
import { MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import { normalizeRange } from "./normalize-range";

const bookId = "psalms-book-id";

describe("normalizeRange", () => {
  it("rejects end before start in the same chapter", () => {
    const result = normalizeRange(
      {
        bookId,
        startChapter: 22,
        startVerse: 3,
        endChapter: 22,
        endVerse: 1,
      },
      () => 10,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(MUTATION_ERROR_CODES.VALIDATION);
    }
  });

  it("expands a single-chapter range in order", () => {
    const result = normalizeRange(
      {
        bookId,
        startChapter: 22,
        startVerse: 1,
        endChapter: 22,
        endVerse: 3,
      },
      () => 6,
    );
    expect(result).toEqual({
      ok: true,
      verses: [
        { bookId, chapter: 22, verse: 1 },
        { bookId, chapter: 22, verse: 2 },
        { bookId, chapter: 22, verse: 3 },
      ],
    });
  });

  it("expands across chapters using verse counts", () => {
    const counts = new Map([[1, 2], [2, 3]]);
    const result = normalizeRange(
      {
        bookId,
        startChapter: 1,
        startVerse: 2,
        endChapter: 2,
        endVerse: 2,
      },
      (chapter) => counts.get(chapter) ?? null,
    );
    expect(result).toEqual({
      ok: true,
      verses: [
        { bookId, chapter: 1, verse: 2 },
        { bookId, chapter: 2, verse: 1 },
        { bookId, chapter: 2, verse: 2 },
      ],
    });
  });
});
