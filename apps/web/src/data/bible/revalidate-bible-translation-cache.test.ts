import { describe, expect, it, vi } from "vitest";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { revalidateBibleTranslationCache } from "./revalidate-bible-translation-cache";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

describe("revalidateBibleTranslationCache", () => {
  it("revalidates the translation cache tag on reload (bible_seed_contract §12)", async () => {
    const { revalidateTag } = await import("next/cache");
    revalidateBibleTranslationCache("ru-synodal");
    expect(revalidateTag).toHaveBeenCalledWith(
      CACHE_TAGS.bibleTranslation("ru-synodal"),
      "max",
    );
  });
});
