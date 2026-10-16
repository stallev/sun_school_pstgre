import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { MESSAGE_LOCALES, type MessageLocale } from "@/lib/messages/get-dictionary";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getPrisma } from "@/lib/db.server";
import { hasServerEnv } from "@/lib/env.server";

/** Seed default (`app_setting.ui_locale`). Used when the build has no database. */
const DEFAULT_UI_LOCALE: MessageLocale = "ru";

const parseLocale = (value: unknown): MessageLocale | null => {
  if (value === "ru" || value === "en") return value;
  return null;
};

async function readUiLocaleFromDb(): Promise<MessageLocale> {
  const db = await getPrisma();
  const row = await db.appSetting.findUnique({ where: { key: "ui_locale" }, select: { value: true } });
  return parseLocale(row?.value) ?? "ru";
}

async function readCachedUiLocale(): Promise<MessageLocale> {
  "use cache";
  cacheTag(CACHE_TAGS.UI_LOCALE);
  cacheLife("max");
  return readUiLocaleFromDb();
}

/**
 * School-wide UI locale (ADR-008 §4.2).
 * The cached read stays behind `hasServerEnv` so a preview build without secrets
 * prerenders the default locale instead of failing `/_not-found`.
 */
export async function getUiLocale(): Promise<MessageLocale> {
  if (!hasServerEnv()) return DEFAULT_UI_LOCALE;
  return readCachedUiLocale();
}

/** Uncached read for the same request after `getUiLocale` was already called. */
export const getUiLocaleUncached = readUiLocaleFromDb;

export const isMessageLocale = (value: string): value is MessageLocale =>
  (MESSAGE_LOCALES as readonly string[]).includes(value);
