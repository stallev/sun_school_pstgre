import "server-only";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";

/** Call after operator reload of a translation (bible_seed_contract §10, ADR-002 §5). */
export function revalidateBibleTranslationCache(translationCode: string): void {
  revalidateTag(CACHE_TAGS.bibleTranslation(translationCode), "max");
}
