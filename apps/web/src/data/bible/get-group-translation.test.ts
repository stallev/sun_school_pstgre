import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP_LOCALE, MUTATION_ERROR_CODES } from "@sunschool/domain";
import { readGroupTranslationFromDb } from "./get-group-translation";

vi.mock("./bible-data.server", () => ({
  readDefaultTranslationByLocale: vi.fn(),
}));

const { readDefaultTranslationByLocale } = await import("./bible-data.server");

describe("readGroupTranslationFromDb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns SCHOOL_LANGUAGE_UNAVAILABLE when EN translation is not READY (bible_seed §8 N)", async () => {
    vi.mocked(readDefaultTranslationByLocale).mockResolvedValue(null);

    const result = await readGroupTranslationFromDb(APP_LOCALE.EN);

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.SCHOOL_LANGUAGE_UNAVAILABLE,
      message: "admin.group.language_unavailable",
    });
  });

  it("returns translation id and code when READY", async () => {
    vi.mocked(readDefaultTranslationByLocale).mockResolvedValue({
      id: "t-1",
      code: "ru-synodal",
      locale: APP_LOCALE.RU,
      status: "READY",
    });

    const result = await readGroupTranslationFromDb(APP_LOCALE.RU);

    expect(result).toEqual({
      ok: true,
      translationId: "t-1",
      code: "ru-synodal",
      locale: APP_LOCALE.RU,
    });
  });
});
