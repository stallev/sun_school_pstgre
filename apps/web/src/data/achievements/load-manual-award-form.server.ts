import "server-only";

import { ACHIEVEMENT_KIND, ACHIEVEMENT_RULE_TYPE, LESSON_STATUS } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { formatTierLabel } from "@/lib/achievements/format-tier-label";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import type { TeacherAchievementsMessages } from "@/lib/messages/teacher-achievements-messages";
import { formatLessonDisplayDate } from "@/lib/lesson/format-lesson-display-date";
import type {
  ManualAwardAchievementOption,
  ManualAwardEvidenceOption,
  ManualAwardFormData,
} from "@/lib/achievements/manual-award-types";

export type { ManualAwardEvidenceOption, ManualAwardFormData } from "@/lib/achievements/manual-award-types";

export async function loadManualAwardForm(
  db: PrismaClient,
  gradeId: string,
  academicYearId: string,
  locale: MessageLocale,
  tierMessages: TeacherAchievementsMessages,
): Promise<ManualAwardFormData> {
  const enrollments = await db.enrollment.findMany({
    where: { gradeId, academicYearId, endsOn: null },
    orderBy: [{ pupil: { lastName: "asc" } }, { pupil: { firstName: "asc" } }],
    select: {
      pupil: {
        select: { id: true, lastName: true, firstName: true, middleName: true },
      },
    },
  });

  const achievements = await db.achievement.findMany({
    where: { kind: ACHIEVEMENT_KIND.REWARD, isActive: true },
    orderBy: [{ category: "asc" }, { nameRu: "asc" }],
    select: {
      id: true,
      nameRu: true,
      nameEn: true,
      ruleType: true,
      tiers: { orderBy: { tier: "asc" } },
    },
  });

  const pupils = enrollments.map((row) => ({
    pupilId: row.pupil.id,
    displayName: formatDisplayName(row.pupil),
  }));

  const achievementOptions: ManualAwardAchievementOption[] = [];
  for (const row of achievements) {
    for (const tierRow of row.tiers) {
      const name = locale === "en" ? row.nameEn : row.nameRu;
      const tierLabel = formatTierLabel(tierRow.tier, tierMessages);
      achievementOptions.push({
        achievementId: row.id,
        tier: tierRow.tier,
        label: `${name} · ${tierLabel} · ${tierRow.points}`,
        catalogPoints: tierRow.points,
        evidenceNeed: row.ruleType === ACHIEVEMENT_RULE_TYPE.MANUAL ? 0 : tierRow.length,
      });
    }
  }

  return { pupils, achievements: achievementOptions };
}

export async function loadManualAwardEvidence(
  db: PrismaClient,
  pupilId: string,
  achievementId: string,
  tier: number,
  academicYearId: string,
  locale: MessageLocale,
  timeZone: string,
): Promise<{ need: number; options: ManualAwardEvidenceOption[] }> {
  const achievement = await db.achievement.findUnique({
    where: { id: achievementId },
    select: { ruleType: true, tiers: { where: { tier } } },
  });
  const tierRow = achievement?.tiers[0];
  const need =
    achievement?.ruleType === ACHIEVEMENT_RULE_TYPE.MANUAL ? 0 : (tierRow?.length ?? 0);

  if (need === 0) return { need: 0, options: [] };

  const occupied = await db.achievementEvidence.findMany({
    where: {
      achievementId,
      tier,
      award: { revokedAt: null },
    },
    select: { checkId: true },
  });
  const occupiedIds = new Set(occupied.map((row) => row.checkId));

  const checks = await db.homeworkCheck.findMany({
    where: {
      pupilId,
      homeworkChecked: true,
      lesson: { academicYearId, status: LESSON_STATUS.CHECK_COMPLETED },
      ...(occupiedIds.size > 0 ? { id: { notIn: [...occupiedIds] } } : {}),
    },
    orderBy: [{ lesson: { lessonDate: "desc" } }, { lesson: { ordinal: "desc" } }],
    take: Math.max(need * 3, 12),
    select: {
      id: true,
      lesson: { select: { ordinal: true, lessonDate: true } },
    },
  });

  const options: ManualAwardEvidenceOption[] = checks.map((check, index) => {
    const dateLabel = formatLessonDisplayDate(check.lesson.lessonDate.toISOString().slice(0, 10), {
      locale,
      timeZone,
    });
    const lessonLabel =
      locale === "en"
        ? `Lesson ${check.lesson.ordinal} · ${dateLabel}`
        : `урок ${check.lesson.ordinal} · ${dateLabel}`;
    return {
      checkId: check.id,
      label: lessonLabel,
      suggested: index < need,
    };
  });

  return { need, options };
}
