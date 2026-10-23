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

export type { PupilPenaltyFormData } from "@/lib/achievements/pupil-penalty-form-types";

export async function loadPupilPenaltyForm(
  db: PrismaClient,
  gradeId: string,
  academicYearId: string,
  locale: MessageLocale,
  timeZone: string,
): Promise<PupilPenaltyFormData> {
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

  const penaltyTypes: PenaltyTypeOption[] = penalties.map((row) => {
    const cap = row.tiers[0]?.points ?? row.threshold ?? 0;
    const name = locale === "en" ? row.nameEn : row.nameRu;
    return {
      achievementId: row.id,
      label: name,
      catalogPoints: Math.abs(cap),
    };
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
