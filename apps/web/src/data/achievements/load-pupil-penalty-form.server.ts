import "server-only";

import { ACHIEVEMENT_KIND, LESSON_STATUS } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { formatLessonDisplayDate } from "@/lib/lesson/format-lesson-display-date";
import type { MessageLocale } from "@/lib/messages/dictionary-types";

import type {
  PenaltyLessonOption,
  PenaltyTypeOption,
  PupilPenaltyFormData,
} from "@/lib/achievements/pupil-penalty-form-types";
import {
  loadGroupAchievementPointsOverrides,
  resolvePenaltyCatalogPoints,
} from "./group-achievement-points.server";

export type { PupilPenaltyFormData } from "@/lib/achievements/pupil-penalty-form-types";

export async function loadPupilPenaltyForm(
  db: PrismaClient,
  gradeId: string,
  academicYearId: string,
  locale: MessageLocale,
  timeZone: string,
): Promise<PupilPenaltyFormData> {
  const overrides = await loadGroupAchievementPointsOverrides(db, gradeId, academicYearId);

  const [penalties, lessons] = await Promise.all([
    db.achievement.findMany({
      where: { kind: ACHIEVEMENT_KIND.PENALTY, isActive: true },
      orderBy: { nameRu: "asc" },
      select: {
        id: true,
        nameRu: true,
        nameEn: true,
        threshold: true,
        tiers: { take: 1, select: { points: true } },
      },
    }),
    db.lesson.findMany({
      where: {
        gradeId,
        academicYearId,
        status: LESSON_STATUS.CHECK_COMPLETED,
      },
      orderBy: [{ lessonDate: "desc" }, { ordinal: "desc" }],
      take: 24,
      select: { id: true, ordinal: true, lessonDate: true },
    }),
  ]);

  const penaltyTypes: PenaltyTypeOption[] = penalties.flatMap((row) => {
    const effective = resolvePenaltyCatalogPoints(
      row.threshold,
      row.tiers[0]?.points,
      overrides,
      row.id,
    );
    if (effective === null) return [];
    const name = locale === "en" ? row.nameEn : row.nameRu;
    return [
      {
        achievementId: row.id,
        label: name,
        catalogPoints: Math.abs(effective.points),
      },
    ];
  });

  const lessonOptions: PenaltyLessonOption[] = lessons.map((row) => {
    const dateLabel = formatLessonDisplayDate(row.lessonDate.toISOString().slice(0, 10), {
      locale,
      timeZone,
    });
    const label =
      locale === "en" ? `Lesson ${row.ordinal} · ${dateLabel}` : `урок ${row.ordinal} · ${dateLabel}`;
    return { lessonId: row.id, label };
  });

  return { penaltyTypes, lessons: lessonOptions };
}
