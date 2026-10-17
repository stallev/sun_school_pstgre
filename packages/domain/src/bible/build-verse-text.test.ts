import { describe, expect, it } from "vitest";
import { buildVerseText } from "./build-verse-text";
import type { VerseMapRow } from "./verse-range";

const bookId = "psalms-book-id";

describe("buildVerseText", () => {
  it("maps Пс. 22:1–3 (Synodal) to Ps. 23:1–3 in NIV via verse map (ADR-009 §7)", () => {
    const mapRows: VerseMapRow[] = [1, 2, 3].map((commonVerse) => ({
      bookId,
      chapterNumber: 23,
      verseNumber: commonVerse,
      commonChapter: 22,
      commonVerse,
    }));

    const texts = new Map<string, string>([
      ["23:1", "The Lord is my shepherd"],
      ["23:2", "he makes me lie down"],
      ["23:3", "he refreshes my soul"],
    ]);

    const result = buildVerseText({
      commonVerses: [
        { bookId, chapter: 22, verse: 1 },
        { bookId, chapter: 22, verse: 2 },
        { bookId, chapter: 22, verse: 3 },
      ],
      mapRows,
      getVerseText: ({ chapter, verse }) => texts.get(`${chapter}:${verse}`),
    });

    expect(result).toEqual({
      ok: true,
      text: "The Lord is my shepherd he makes me lie down he refreshes my soul",
    });
  });

  it("returns missing[] when a verse has no text", () => {
    const result = buildVerseText({
      commonVerses: [{ bookId, chapter: 1, verse: 1 }],
      mapRows: [],
      getVerseText: () => null,
    });

    expect(result).toEqual({
      ok: false,
      missing: [{ bookId, chapter: 1, verse: 1 }],
    });
  });
});
