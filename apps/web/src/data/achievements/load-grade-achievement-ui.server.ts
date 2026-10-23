import "server-only";

import type { PrismaClient } from "@sunschool/db";
import { readFeaturesAchievementsEnabled } from "./achievement-feature.server";
import { loadGradeAchievementMode, type GradeAchievementMode } from "./achievement-mode.server";
import { formatDateTime } from "@/lib/i18n/format";
import type { MessageLocale } from "@/lib/messages/dictionary-types";

export type GradeAchievementUi = {
  achievementsEnabled: boolean;
  mode: GradeAchievementMode;
  offPeriodLabel: string | null;
};

export async function loadGradeAchievementUi(
  db: PrismaClient,
  gradeId: string,
  academicYearId: string,
  locale: MessageLocale,
  timeZone: string,
): Promise<GradeAchievementUi | null> {
  const flagOn = await db.$transaction((tx) => readFeaturesAchievementsEnabled(tx));
  if (!flagOn) return null;

  const mode = await db.$transaction((tx) => loadGradeAchievementMode(tx, gradeId, academicYearId));
  if (!mode) return null;

  const lastOff = mode.offPeriods
    .filter((p) => !p.endsAt)
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())[0];
  const offPeriodLabel =
    !mode.achievementsEnabled && lastOff
      ? formatDateTime(lastOff.startsAt, {
          locale,
          timeZone,
          day: "numeric",
          month: "long",
        })
      : null;

  return {
    achievementsEnabled: mode.achievementsEnabled,
    mode,
    offPeriodLabel,
  };
}
