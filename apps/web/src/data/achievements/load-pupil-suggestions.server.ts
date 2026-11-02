import "server-only";

import { ACHIEVEMENT_SUGGESTION_STATUS, type AppLocale } from "@sunschool/domain";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import type { PrismaClient } from "@sunschool/db";
import { formatDateTime } from "@/lib/i18n/format";
import type { PupilSuggestionRow } from "@/lib/achievements/pupil-achievement-panel-types";
import { loadSuggestionVerses } from "./load-suggestion-verses.server";

type LoadPupilSuggestionsArgs = {
  actorUserId: string;
  isAdmin: boolean;
  /** AZ-66: teacher in a closed year / mode off sees the block read-only. */
  canAct: boolean;
  pupilId: string;
  academicYearId: string;
  locale: MessageLocale;
  timeZone: string;
};

/**
 * Pending (SUGGESTED) suggestions of a pupil for the year. AZ-57: a teacher gets only groups
 * they are assigned to in that year; an admin gets all groups. Foreign groups -> nothing.
 */
export async function loadPupilSuggestions(
  db: PrismaClient,
  args: LoadPupilSuggestionsArgs,
): Promise<PupilSuggestionRow[]> {
  const { actorUserId, isAdmin, canAct, pupilId, academicYearId, locale, timeZone } = args;
  const rows = await db.achievementSuggestion.findMany({
    where: {
      pupilId,
      academicYearId,
      status: ACHIEVEMENT_SUGGESTION_STATUS.SUGGESTED,
      ...(isAdmin
        ? {}
        : {
            grade: {
              assignments: { some: { userId: actorUserId, academicYearId } },
            },
          }),
    },
    orderBy: { suggestedAt: "asc" },
    select: {
      id: true,
      tier: true,
      deferredAt: true,
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
    seriesLength: row.evidenceCheckIds.length,
    deferredDateLabel: row.deferredAt
      ? formatDateTime(row.deferredAt, { locale, timeZone, day: "numeric", month: "long" })
      : null,
    verses: verses[index] ?? [],
    canAct,
  }));
}
