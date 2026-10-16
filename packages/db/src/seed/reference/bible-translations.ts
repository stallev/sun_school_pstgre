import { APP_LOCALE } from "@sunschool/domain";
import { emptyCounts, type SeedCounts, type SeedTx } from "./types";

/**
 * seed_data_spec §6: the two translations. Created once; `status` is owned by the Bible loader
 * (`NO_DATA → LOADING → READY`), so an existing row is never touched.
 */
export const BIBLE_TRANSLATIONS = [
  {
    code: "ru-synodal",
    locale: APP_LOCALE.RU,
    name: "Синодальный перевод",
    shortName: "RST",
    source: "Russian Synodal Translation (public domain)",
    license: "Public domain",
    isDefault: true,
  },
  {
    code: "en-niv",
    locale: APP_LOCALE.EN,
    name: "New International Version",
    shortName: "NIV",
    source: "Biblica, Inc.",
    license: "Copyright Biblica, Inc. — use subject to the licence (ADR-009)",
    isDefault: true,
  },
] as const;

export async function ensureBibleTranslations(tx: SeedTx): Promise<SeedCounts> {
  const counts = emptyCounts();
  for (const translation of BIBLE_TRANSLATIONS) {
    const existing = await tx.bibleTranslation.findUnique({ where: { code: translation.code } });
    if (existing) continue;
    await tx.bibleTranslation.create({ data: { ...translation } });
    counts.created += 1;
  }
  return counts;
}
