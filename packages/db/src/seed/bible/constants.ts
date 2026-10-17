/** Canonical translation row from reference seed (`bible-translations.ts`). */
export const RST_TRANSLATION_CODE = "ru-synodal";
export const NIV_TRANSLATION_CODE = "en-niv";

export const BIBLE_EXPECTED = {
  books: 66,
  chapters: 1189,
  versesRst: 31_166,
  versesNiv: 31_103,
} as const;

export const NIV_LICENSE =
  "Scripture quotations marked NIV are taken from the Holy Bible, New International Version®, NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission. All rights reserved worldwide.";

export const BIBLE_SEED_LOCK_KEY = "7340125503";

export const DEFAULT_VERSE_BATCH_SIZE = 1000;

export function verseBatchSize(): number {
  const raw = process.env.BIBLE_SEED_VERSE_BATCH_SIZE;
  if (!raw) return DEFAULT_VERSE_BATCH_SIZE;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_VERSE_BATCH_SIZE;
}
