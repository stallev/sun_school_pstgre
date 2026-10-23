import "server-only";
import {
  ACHIEVEMENT_KIND,
  LESSON_STATUS,
  type AchievementEvaluateFact,
  type AchievementEvaluateRule,
  type AchievementExistingAward,
} from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";
import {
  buildAchievementEvaluateFacts,
  type AchievementCheckFactRow,
} from "./achievement-fact-state.server";
import { isLessonInAchievementOffPeriod, loadGradeAchievementMode } from "./achievement-mode.server";

type Tx = Prisma.TransactionClient;

export async function loadAchievementEvaluateContext(
  tx: Tx,
  pupilId: string,
  academicYearId: string,
  gradeId: string,
): Promise<{
  rules: AchievementEvaluateRule[];
  awards: AchievementExistingAward[];
  factsByMetric: Map<string, AchievementEvaluateFact[]>;
}> {
  const mode = await loadGradeAchievementMode(tx, gradeId, academicYearId);

  const checks = await tx.homeworkCheck.findMany({
    where: {
      pupilId,
      homeworkChecked: true,
      lesson: { academicYearId, status: LESSON_STATUS.CHECK_COMPLETED },
    },
    orderBy: [{ lesson: { lessonDate: "asc" } }, { lesson: { ordinal: "asc" } }],
    select: {
      id: true,
      testScore: true,
      notebookScore: true,
      singing: true,
      pointsTotal: true,
      homeworkChecked: true,
      lesson: { select: { kind: true, lessonDate: true, hasTest: true } },
      verseScores: { select: { score: true } },
    },
  });

  const factRows: AchievementCheckFactRow[] = checks.map((check) => ({
    checkId: check.id,
    lessonKind: check.lesson.kind,
    lessonHasTest: check.lesson.hasTest,
    lessonInOffPeriod: mode ? isLessonInAchievementOffPeriod(check.lesson.lessonDate, mode) : true,
    homeworkChecked: check.homeworkChecked,
    testScore: check.testScore,
    notebookScore: check.notebookScore,
    singing: check.singing,
    verseScores: check.verseScores.map((row) => row.score),
    lessonPoints: check.pointsTotal,
  }));

  const catalog = await tx.achievement.findMany({
    where: { kind: ACHIEVEMENT_KIND.REWARD },
    select: {
      id: true,
      ruleType: true,
      metric: true,
      isActive: true,
      tiers: { select: { tier: true, length: true, points: true }, orderBy: { tier: "asc" } },
    },
  });

  const rules: AchievementEvaluateRule[] = catalog.map((row) => ({
    achievementId: row.id,
    ruleType: row.ruleType as AchievementEvaluateRule["ruleType"],
    metric: row.metric,
    isActive: row.isActive,
    tiers: row.tiers.map((tier) => ({ tier: tier.tier, length: tier.length, points: tier.points })),
  }));

  const awardRows = await tx.achievementAward.findMany({
    where: { pupilId, academicYearId },
    select: {
      achievementId: true,
      tier: true,
      academicYearId: true,
      revokedAt: true,
      evidence: { select: { checkId: true } },
    },
  });

  const awards: AchievementExistingAward[] = awardRows.map((row) => ({
    achievementId: row.achievementId,
    tier: row.tier,
    academicYearId: row.academicYearId,
    revokedAt: row.revokedAt?.toISOString() ?? null,
    evidenceFactIds: row.evidence.map((evidence) => evidence.checkId),
  }));

  const metrics = rules.map((rule) => rule.metric ?? "");
  const factsByMetric = buildAchievementEvaluateFacts(factRows, metrics);

  return { rules, awards, factsByMetric };
}
