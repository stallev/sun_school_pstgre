import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { MUTATION_ERROR_CODES, type AppLocale } from "@sunschool/domain";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { hasServerEnv } from "@/lib/env.server";
import { readDefaultTranslationByLocale, type BibleTranslationRow } from "./bible-data.server";

export type ResolveGroupTranslationResult =
  | { ok: true; translationId: string; code: string; locale: AppLocale }
  | {
      ok: false;
      code: typeof MUTATION_ERROR_CODES.SCHOOL_LANGUAGE_UNAVAILABLE;
      message: string;
    };

function toResolveResult(row: BibleTranslationRow | null): ResolveGroupTranslationResult {
  if (!row) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.SCHOOL_LANGUAGE_UNAVAILABLE,
      message: "admin.group.language_unavailable",
    };
  }
  return {
    ok: true,
    translationId: row.id,
    code: row.code,
    locale: row.locale,
  };
}

export async function readGroupTranslationFromDb(
  language: AppLocale,
): Promise<ResolveGroupTranslationResult> {
  const row = await readDefaultTranslationByLocale(language);
  return toResolveResult(row);
}

async function readCachedGroupTranslation(language: AppLocale): Promise<ResolveGroupTranslationResult> {
  "use cache";
  cacheLife("max");
  const row = await readDefaultTranslationByLocale(language);
  if (row?.code) {
    cacheTag(CACHE_TAGS.bibleTranslation(row.code));
  }
  return toResolveResult(row);
}

/** Resolves the group's Bible translation from grade language (bible_seed_contract §3, ПБ-3). */
export async function resolveGroupTranslation(
  language: AppLocale,
): Promise<ResolveGroupTranslationResult> {
  if (!hasServerEnv()) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.SCHOOL_LANGUAGE_UNAVAILABLE,
      message: "admin.group.language_unavailable",
    };
  }
  return readCachedGroupTranslation(language);
}
