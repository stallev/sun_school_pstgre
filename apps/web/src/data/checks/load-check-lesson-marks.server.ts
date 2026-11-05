import "server-only";

import {
  ACHIEVEMENT_KIND,
  getCalendarDateInTimeZone,
  PENALTY_STATUS,
  resolveEffectivePoints,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { readFeaturesAchievementsEnabled } from "@/data/achievements/achievement-feature.server";
import { loadGradeAchievementUi } from "@/data/achievements/load-grade-achievement-ui.server";
import {
  loadGroupAchievementPointsOverrides,
  resolvePenaltyCatalogPoints,
} from "@/data/achievements/group-achievement-points.server";
import { CHECK_LESSON_AWARD_CODES } from "@/lib/achievements/catalog-display";
import type {
  CheckLessonAwardOption,
  CheckLessonMarksData,
  CheckLessonPupilMarks,
} from "@/lib/achievements/check-lesson-marks-types";
import type { PenaltyTypeOption } from "@/lib/achievements/pupil-penalty-form-types";
import { formatLessonDisplayDate } from "@/lib/lesson/format-lesson-display-date";
import type { MessageLocale } from "@/lib/messages/dictionary-types";

export type { CheckLessonMarksData } from "@/lib/achievements/check-lesson-marks-types";

const awardCodeOrder = new Map<string, number>(
  CHECK_LESSON_AWARD_CODES.map((code, index) => [code, index]),
);

export async function loadCheckLessonMarks(
  db: PrismaClient,
  input: {
    gradeId: string;
    academicYearId: string;
    lessonId: string;
    lessonDateIso: string;
    pupilIds: readonly string[];
    canMutate: boolean;
    locale: MessageLocale;
    timeZone: string;
  },
): Promise<CheckLessonMarksData> {
  if (!input.canMutate) return { marksEnabled: false };

  const flagOn = await readFeaturesAchievementsEnabled(db);
  if (!flagOn) return { marksEnabled: false };

  const gradeUi = await loadGradeAchievementUi(
    db,
    input.gradeId,
    input.academicYearId,
    input.locale,
    input.timeZone,
  );
  if (!gradeUi?.achievementsEnabled) return { marksEnabled: false };

  const pupilIds = [...new Set(input.pupilIds)];
  const emptyByPupil = (): Record<string, CheckLessonPupilMarks> =>
    Object.fromEntries(
      pupilIds.map((pupilId) => [pupilId, { eventCaptions: [], penalty: null } satisfies CheckLessonPupilMarks]),
    );

  if (pupilIds.length === 0) {
    return {
      marksEnabled: true,
      lessonId: input.lessonId,
      academicYearId: input.academicYearId,
      lessonDateIso: input.lessonDateIso,
      awardOptions: [],
      penaltyTypes: [],
      eventDate: { locale: input.locale, today: input.lessonDateIso, min: input.lessonDateIso },
      byPupilId: {},
    };
  }

  const [achievements, overrides, year, timezoneRow, penalties] = await Promise.all([
    db.achievement.findMany({
      where: { code: { in: [...CHECK_LESSON_AWARD_CODES] }, isActive: true },
      select: {
        id: true,
        code: true,
        nameRu: true,
        nameEn: true,
        tiers: { where: { tier: 1 } },
      },
    }),
    loadGroupAchievementPointsOverrides(db, input.gradeId, input.academicYearId),
    db.academicYear.findUnique({
      where: { id: input.academicYearId },
      select: { startsOn: true },
    }),
    db.appSetting.findUnique({ where: { key: "school_timezone" }, select: { value: true } }),
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
  ]);

  const timeZone =
    typeof timezoneRow?.value === "string" && timezoneRow.value.trim() !== ""
      ? timezoneRow.value
      : input.timeZone;
  const today = getCalendarDateInTimeZone(new Date(), timeZone);
  const yearStart = year ? year.startsOn.toISOString().slice(0, 10) : today;
  const lessonDateLabel = formatLessonDisplayDate(input.lessonDateIso, {
    locale: input.locale,
    timeZone,
  });

  const awardOptions: CheckLessonAwardOption[] = achievements
    .slice()
    .sort(
      (a, b) =>
        (awardCodeOrder.get(a.code) ?? 99) - (awardCodeOrder.get(b.code) ?? 99),
    )
    .flatMap((row) => {
      const tierRow = row.tiers[0];
      if (!tierRow) return [];
      const effective = resolveEffectivePoints(tierRow.points, overrides.get(`${row.id}:1`));
      const name = input.locale === "en" ? row.nameEn : row.nameRu;
      return [
        {
          achievementId: row.id,
          code: row.code,
          tier: 1,
          name,
          catalogPoints: tierRow.points,
          maxPoints: effective,
        },
      ];
    });

  const achievementIds = awardOptions.map((row) => row.achievementId);
  const nameByAchievementId = new Map(awardOptions.map((row) => [row.achievementId, row.name]));

  const penaltyTypes: PenaltyTypeOption[] = penalties.flatMap((row) => {
    const effective = resolvePenaltyCatalogPoints(
      row.threshold,
      row.tiers[0]?.points,
      overrides,
      row.id,
    );
    if (effective === null) return [];
    const name = input.locale === "en" ? row.nameEn : row.nameRu;
    return [
      {
        achievementId: row.id,
        label: name,
        catalogPoints: Math.abs(effective.points),
      },
    ];
  });

  const awardKeySuffix = `:${input.lessonDateIso}`;
  const [awardRows, penaltyRows] = await Promise.all([
    achievementIds.length === 0
      ? Promise.resolve([])
      : db.achievementAward.findMany({
          where: {
            pupilId: { in: pupilIds },
            achievementId: { in: achievementIds },
            academicYearId: input.academicYearId,
            awardKey: { endsWith: awardKeySuffix },
          },
          select: { pupilId: true, achievementId: true },
        }),
    db.penalty.findMany({
      where: {
        pupilId: { in: pupilIds },
        lessonId: input.lessonId,
        status: PENALTY_STATUS.ACTIVE,
      },
      select: {
        id: true,
        pupilId: true,
        points: true,
        achievement: { select: { nameRu: true, nameEn: true } },
      },
    }),
  ]);

  const byPupilId = emptyByPupil();

  for (const row of awardRows) {
    const name = nameByAchievementId.get(row.achievementId);
    if (!name) continue;
    const bucket = byPupilId[row.pupilId];
    if (!bucket) continue;
    bucket.eventCaptions.push(`${name} · ${lessonDateLabel}`);
  }

  for (const row of penaltyRows) {
    const bucket = byPupilId[row.pupilId];
    if (!bucket) continue;
    const name = input.locale === "en" ? row.achievement.nameEn : row.achievement.nameRu;
    bucket.penalty = {
      id: row.id,
      name,
      points: Math.abs(row.points),
    };
  }

  for (const pupilId of Object.keys(byPupilId)) {
    byPupilId[pupilId]!.eventCaptions.sort((a, b) => a.localeCompare(b, input.locale));
  }

  return {
    marksEnabled: true,
    lessonId: input.lessonId,
    academicYearId: input.academicYearId,
    lessonDateIso: input.lessonDateIso,
    awardOptions,
    penaltyTypes,
    eventDate: { locale: input.locale, today, min: yearStart },
    byPupilId,
  };
}
