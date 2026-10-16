import type { Prisma } from "../../generated/prisma/client";
import { emptyCounts, type SeedCounts, type SeedTx } from "./types";

/**
 * Defaults of `app_setting` (seed_data_spec §6, ADR-004, ADR-005). Existing keys are NEVER
 * overwritten: an admin may have changed the language or time zone since the first seed.
 * `db_environment` is handled by the env guard; `legacy_consent_deadline_on` only by the migration.
 */
export const CONSENT_TEXT_VERSION_DEFAULT = "v1";

export const APP_SETTING_DEFAULTS: Readonly<Record<string, Prisma.InputJsonValue>> = {
  ui_locale: "ru",
  school_timezone: "UTC",
  "features.achievements": false,
  "features.parents": false,
  "features.voice": false,
  consent_text_version: CONSENT_TEXT_VERSION_DEFAULT,
};

export async function ensureAppSettings(tx: SeedTx): Promise<SeedCounts> {
  const counts = emptyCounts();
  for (const [key, value] of Object.entries(APP_SETTING_DEFAULTS)) {
    const existing = await tx.appSetting.findUnique({ where: { key } });
    if (existing) continue;
    await tx.appSetting.create({ data: { key, value } });
    counts.created += 1;
  }
  return counts;
}
