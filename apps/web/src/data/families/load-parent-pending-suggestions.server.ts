import "server-only";

import {
  ACHIEVEMENT_SUGGESTION_STATUS,
  type AppLocale,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { loadSuggestionVerses } from "@/data/achievements/load-suggestion-verses.server";
import type { SuggestionVerseView } from "@/lib/achievements/pupil-achievement-panel-types";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import type { MessageLocale } from "@/lib/messages/dictionary-types";

export type ParentSuggestionView = {
  suggestionId: string;
  achievementName: string;
  tier: number;
  verses: SuggestionVerseView[];
};

type Args = {
  pupilId: string;
  academicYearId: string;
  achievementsEnabled: boolean;
  locale: MessageLocale;
  timeZone: string;
};

/**
 * Pending (SUGGESTED) suggestions of the child for the active year (contract section 6.5, S-6).
 * The caller has already passed the parent-consent check; no points or action fields are exposed.
 */
export async function loadParentPendingSuggestions(
  db: PrismaClient,
  args: Args,
): Promise<ParentSuggestionView[]> {
  const { pupilId, academicYearId, achievementsEnabled, locale, timeZone } = args;
  if (!achievementsEnabled) return [];

  const rows = await db.achievementSuggestion.findMany({
    where: { pupilId, academicYearId, status: ACHIEVEMENT_SUGGESTION_STATUS.SUGGESTED },
    orderBy: { suggestedAt: "asc" },
    select: {
      id: true,
      tier: true,
      evidenceCheckIds: true,
      achievement: { select: { nameRu: true, nameEn: true } },
      grade: { select: { language: true } },
    },
  });
  if (rows.length === 0) return [];

  const verses = await loadSuggestionVerses(
    db,
    rows.map((row) => ({
      gradeLanguage: row.grade.language as AppLocale,
      evidenceCheckIds: row.evidenceCheckIds,
    })),
    messageLocaleToAppLocale(locale),
    timeZone,
  );

  return rows.map((row, index) => ({
    suggestionId: row.id,
    achievementName: locale === "en" ? row.achievement.nameEn : row.achievement.nameRu,
    tier: row.tier,
    verses: verses[index] ?? [],
  }));
}
