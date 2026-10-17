import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP_LOCALE } from "@sunschool/domain";
import {
  readBuildVerseTextForRangeFromDb,
  readVerseTextByIndexFromDb,
} from "./get-verse-text";

vi.mock("./bible-data.server", () => ({
  readTranslationByCode: vi.fn(),
  readVerseTextRow: vi.fn(),
  readSynodalTranslationId: vi.fn(),
  readChapterVerseMaxByTranslation: vi.fn(),
  readVerseMapForTranslation: vi.fn(),
  readVerseTextsForBook: vi.fn(),
}));

const bibleData = await import("./bible-data.server");

describe("readVerseTextByIndexFromDb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns verse text for translation book chapter verse index", async () => {
    vi.mocked(bibleData.readTranslationByCode).mockResolvedValue({
      id: "tr-1",
      code: "ru-synodal",
      locale: APP_LOCALE.RU,
      status: "READY",
    });
    vi.mocked(bibleData.readVerseTextRow).mockResolvedValue("В начале");

    const text = await readVerseTextByIndexFromDb({
      translationCode: "ru-synodal",
      bookId: "book-1",
      chapterNumber: 1,
      verseNumber: 1,
    });

    expect(text).toBe("В начале");
    expect(bibleData.readVerseTextRow).toHaveBeenCalledWith("tr-1", "book-1", 1, 1);
  });

  it("returns null when translation is not READY", async () => {
    vi.mocked(bibleData.readTranslationByCode).mockResolvedValue(null);

    const text = await readVerseTextByIndexFromDb({
      translationCode: "en-niv",
      bookId: "book-1",
      chapterNumber: 1,
      verseNumber: 1,
    });

    expect(text).toBeNull();
    expect(bibleData.readVerseTextRow).not.toHaveBeenCalled();
  });
});

describe("readBuildVerseTextForRangeFromDb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns missing[] when verse text is absent (bible_seed_contract §5.2)", async () => {
    const bookId = "88888888-8888-4888-8888-888888888888";
    vi.mocked(bibleData.readTranslationByCode).mockResolvedValue({
      id: "tr-en",
      code: "en-niv",
      locale: APP_LOCALE.EN,
      status: "READY",
    });
    vi.mocked(bibleData.readSynodalTranslationId).mockResolvedValue("tr-ru");
    vi.mocked(bibleData.readChapterVerseMaxByTranslation).mockResolvedValue(new Map([[1, 10]]));
    vi.mocked(bibleData.readVerseMapForTranslation).mockResolvedValue([]);
    vi.mocked(bibleData.readVerseTextsForBook).mockResolvedValue(new Map());

    const result = await readBuildVerseTextForRangeFromDb("en-niv", {
      bookId,
      startChapter: 1,
      startVerse: 1,
      endChapter: 1,
      endVerse: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toEqual([{ bookId, chapter: 1, verse: 1 }]);
    }
  });
});
