import "server-only";
import type { Prisma } from "@sunschool/db";

type Tx = Prisma.TransactionClient;

export type GradeAchievementMode = {
  achievementsEnabled: boolean;
  offPeriods: { startsAt: Date; endsAt: Date | null }[];
};

export async function loadGradeAchievementMode(
  tx: Tx,
  gradeId: string,
  academicYearId: string,
): Promise<GradeAchievementMode | null> {
  const settings = await tx.gradeSettings.findUnique({
    where: { gradeId_academicYearId: { gradeId, academicYearId } },
    select: {
      achievementsEnabled: true,
      achievementPeriods: { select: { startsAt: true, endsAt: true } },
    },
  });
  if (!settings) return null;
  return {
    achievementsEnabled: settings.achievementsEnabled,
    offPeriods: settings.achievementPeriods,
  };
}

/** Lesson instant falls in a disabled-mode window (ДС-14). */
export function isLessonInAchievementOffPeriod(
  lessonDate: Date,
  mode: GradeAchievementMode,
): boolean {
  if (!mode.achievementsEnabled) return true;
  const instant = lessonDate.getTime();
  return mode.offPeriods.some((period) => {
    const start = period.startsAt.getTime();
    const end = period.endsAt?.getTime() ?? Number.POSITIVE_INFINITY;
    return instant >= start && instant < end;
  });
}
