import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  AWARD_SOURCE,
  LESSON_STATUS,
  evaluateAchievements,
  type AchievementExistingAward,
  type AchievementProposedAward,
} from "@sunschool/domain";
import { Prisma, writeAudit, type Prisma as PrismaTypes } from "@sunschool/db";
import { lockPupilRow } from "../school/school-pupil-shared.server";
import { loadAchievementEvaluateContext } from "./achievement-evaluate-context.server";
import { readFeaturesAchievementsEnabled } from "./achievement-feature.server";
import { loadGradeAchievementMode } from "./achievement-mode.server";

type Tx = PrismaTypes.TransactionClient;

export type EvaluatePupilResult = { awardIds: string[] };

function mergeAwards(
  existing: readonly AchievementExistingAward[],
  proposed: readonly AchievementProposedAward[],
): AchievementExistingAward[] {
  return [
    ...existing,
    ...proposed.map((award) => ({
      achievementId: award.achievementId,
      tier: award.tier,
      academicYearId: "",
      evidenceFactIds: award.evidenceFactIds,
    })),
  ];
}

function buildRuleSnapshot(
  achievement: { code: string; ruleType: string; metric: string | null; threshold: number | null },
  tier: { tier: number; length: number; points: number },
): Prisma.InputJsonValue {
  return {
    code: achievement.code,
    ruleType: achievement.ruleType,
    metric: achievement.metric,
    threshold: achievement.threshold,
    tier: tier.tier,
    length: tier.length,
    points: tier.points,
  };
}

async function persistProposedAwards(
  tx: Tx,
  pupilId: string,
  academicYearId: string,
  proposed: readonly AchievementProposedAward[],
  awardedAt: Date,
): Promise<string[]> {
  const createdIds: string[] = [];
  for (const award of proposed) {
    const achievement = await tx.achievement.findUnique({
      where: { id: award.achievementId },
      select: {
        code: true,
        ruleType: true,
        metric: true,
        threshold: true,
        tiers: { where: { tier: award.tier } },
      },
    });
    if (!achievement) continue;
    const tierRow = achievement.tiers[0];
    if (!tierRow) continue;

    try {
      const row = await tx.achievementAward.create({
        data: {
          pupilId,
          achievementId: award.achievementId,
          tier: award.tier,
          academicYearId,
          points: award.points,
          ruleSnapshot: buildRuleSnapshot(achievement, tierRow),
          source: AWARD_SOURCE.AUTO,
          awardedAt,
          awardKey: award.awardKey,
          evidence: {
            create: award.evidenceFactIds.map((checkId) => ({
              achievementId: award.achievementId,
              tier: award.tier,
              checkId,
            })),
          },
        },
      });
      createdIds.push(row.id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        continue;
      }
      throw error;
    }
  }
  return createdIds;
}

/**
 * Persists new auto-awards for one pupil (achievements_and_penalties_contract §6.2).
 * Caller must run inside an interactive transaction; no-op when the feature flag is off.
 */
export async function evaluatePupilInTransaction(
  tx: Tx,
  actorUserId: string,
  pupilId: string,
  academicYearId: string,
  gradeId: string,
): Promise<EvaluatePupilResult> {
  const flagOn = await readFeaturesAchievementsEnabled(tx);
  if (!flagOn) return { awardIds: [] };

  const mode = await loadGradeAchievementMode(tx, gradeId, academicYearId);
  if (!mode?.achievementsEnabled) return { awardIds: [] };

  const locked = await lockPupilRow(tx, pupilId);
  if (!locked) return { awardIds: [] };

  const { rules, awards, factsByMetric } = await loadAchievementEvaluateContext(
    tx,
    pupilId,
    academicYearId,
    gradeId,
  );

  const context = { pupilId, academicYearId };
  const proposed: AchievementProposedAward[] = [];
  let mergedAwards = [...awards];

  for (const rule of rules) {
    const metric = rule.metric ?? "";
    const facts = factsByMetric.get(metric) ?? [];
    const batch = evaluateAchievements(facts, [rule], mergedAwards, context);
    if (batch.length === 0) continue;
    proposed.push(...batch);
    mergedAwards = mergeAwards(mergedAwards, batch);
  }

  if (proposed.length === 0) return { awardIds: [] };

  const awardedAt = new Date();
  const awardIds = await persistProposedAwards(tx, pupilId, academicYearId, proposed, awardedAt);
  const primaryAwardId = awardIds[0];
  if (!primaryAwardId) return { awardIds: [] };

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.ACHIEVEMENT_AWARD,
    entityId: primaryAwardId,
    action: AUDIT_ACTION.ACHIEVEMENT_EVALUATED,
    newValue: { awardIds, pupilId },
  });

  return { awardIds };
}

export async function maybeEvaluatePupilAchievements(
  tx: Tx,
  actorUserId: string,
  pupilId: string,
  academicYearId: string,
  gradeId: string,
): Promise<void> {
  const flagOn = await readFeaturesAchievementsEnabled(tx);
  if (!flagOn) return;
  const mode = await loadGradeAchievementMode(tx, gradeId, academicYearId);
  if (!mode?.achievementsEnabled) return;
  await evaluatePupilInTransaction(tx, actorUserId, pupilId, academicYearId, gradeId);
}

export async function evaluateAchievementsForYearClose(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  yearId: string,
): Promise<void> {
  const flagOn = await readFeaturesAchievementsEnabled(tx);
  if (!flagOn) return;

  const enabledGrades = await tx.gradeSettings.findMany({
    where: { academicYearId: yearId, achievementsEnabled: true },
    select: { gradeId: true },
  });
  const enabledGradeIds = new Set(enabledGrades.map((row) => row.gradeId));
  if (enabledGradeIds.size === 0) return;

  const pupilGroups = await tx.homeworkCheck.groupBy({
    by: ["pupilId"],
    where: {
      homeworkChecked: true,
      lesson: { academicYearId: yearId, status: LESSON_STATUS.CHECK_COMPLETED },
      pupil: { organizationId },
    },
  });

  for (const row of pupilGroups) {
    const sample = await tx.homeworkCheck.findFirst({
      where: {
        pupilId: row.pupilId,
        homeworkChecked: true,
        lesson: { academicYearId: yearId, status: LESSON_STATUS.CHECK_COMPLETED },
      },
      select: { lesson: { select: { gradeId: true, academicYearId: true } } },
      orderBy: [{ lesson: { lessonDate: "desc" } }],
    });
    if (!sample || !enabledGradeIds.has(sample.lesson.gradeId)) continue;
    await evaluatePupilInTransaction(
      tx,
      actorUserId,
      row.pupilId,
      sample.lesson.academicYearId,
      sample.lesson.gradeId,
    );
  }
}
