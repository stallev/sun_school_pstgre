import "server-only";

import { AWARD_SOURCE } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { loadGradeAchievementUi } from "./load-grade-achievement-ui.server";
import type { MessageLocale } from "@/lib/messages/dictionary-types";

export type TodayMarkAwardRow = {
  awardId: string;
  pupilId: string;
  pupilName: string;
  achievementName: string;
  tier: number;
  points: number;
  isManual: boolean;
};

export type TodayAchievementMarkData =
  | { kind: "hidden" }
  | { kind: "mode_off"; gradeId: string }
  | {
      kind: "ready";
      gradeId: string;
      academicYearId: string;
      rows: TodayMarkAwardRow[];
    };

const startOfDayUtc = (timeZone: string): Date => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return new Date(`${y}-${m}-${d}T00:00:00.000Z`);
};

export async function loadTodayAchievementMark(
  db: PrismaClient,
  gradeId: string,
  academicYearId: string,
  locale: MessageLocale,
  timeZone: string,
): Promise<TodayAchievementMarkData> {
  const ui = await loadGradeAchievementUi(db, gradeId, academicYearId, locale, timeZone);
  if (!ui) return { kind: "hidden" };
  if (!ui.achievementsEnabled) return { kind: "mode_off", gradeId };

  const dayStart = startOfDayUtc(timeZone);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const enrollments = await db.enrollment.findMany({
    where: { gradeId, academicYearId, endsOn: null },
    select: { pupilId: true },
  });
  const pupilIds = enrollments.map((e) => e.pupilId);
  if (pupilIds.length === 0) {
    return { kind: "ready", gradeId, academicYearId, rows: [] };
  }

  const awards = await db.achievementAward.findMany({
    where: {
      pupilId: { in: pupilIds },
      academicYearId,
      revokedAt: null,
      awardedAt: { gte: dayStart, lt: dayEnd },
    },
    orderBy: { awardedAt: "desc" },
    select: {
      id: true,
      pupilId: true,
      tier: true,
      points: true,
      source: true,
      pupil: { select: { firstName: true, lastName: true, middleName: true } },
      achievement: { select: { nameRu: true } },
    },
  });

  const rows: TodayMarkAwardRow[] = awards.map((row) => ({
    awardId: row.id,
    pupilId: row.pupilId,
    pupilName: formatDisplayName(row.pupil),
    achievementName: row.achievement.nameRu,
    tier: row.tier,
    points: row.points,
    isManual: row.source === AWARD_SOURCE.MANUAL,
  }));

  return { kind: "ready", gradeId, academicYearId, rows };
}
