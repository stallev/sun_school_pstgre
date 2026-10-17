import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getPrisma } from "@/lib/db.server";
import { hasServerEnv } from "@/lib/env.server";

const APP_SETTING_SCHOOL_TIMEZONE_KEY = "school_timezone";

/** Seed default (`app_setting.school_timezone`, ADR-004 §4.6). */
const DEFAULT_SCHOOL_TIMEZONE = "UTC";

async function readSchoolTimezoneFromDb(): Promise<string> {
  const db = await getPrisma();
  const row = await db.appSetting.findUnique({
    where: { key: APP_SETTING_SCHOOL_TIMEZONE_KEY },
    select: { value: true },
  });
  if (typeof row?.value === "string" && row.value.trim() !== "") {
    return row.value;
  }
  return DEFAULT_SCHOOL_TIMEZONE;
}

async function readCachedSchoolTimezone(): Promise<string> {
  "use cache";
  cacheTag(CACHE_TAGS.SCHOOL_TIMEZONE);
  cacheLife("max");
  return readSchoolTimezoneFromDb();
}

/**
 * School-wide IANA time zone (ADR-004 §4).
 * Cached read stays behind `hasServerEnv` for preview builds without secrets.
 */
export async function getSchoolTimezone(): Promise<string> {
  if (!hasServerEnv()) return DEFAULT_SCHOOL_TIMEZONE;
  return readCachedSchoolTimezone();
}

/** Uncached read for the same request after `getSchoolTimezone` was already called. */
export const getSchoolTimezoneUncached = readSchoolTimezoneFromDb;
