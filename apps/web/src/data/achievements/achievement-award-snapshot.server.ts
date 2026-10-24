import "server-only";
import type { Prisma } from "@sunschool/db";

export type AchievementRuleSnapshotMeta = {
  pointsSource: "global" | "grade";
  gradeId: string;
};

export function buildAchievementRuleSnapshot(
  achievement: { code: string; ruleType: string; metric: string | null; threshold: number | null },
  tier: { tier: number; length: number; points: number },
  meta: AchievementRuleSnapshotMeta,
): Prisma.InputJsonValue {
  return {
    code: achievement.code,
    ruleType: achievement.ruleType,
    metric: achievement.metric,
    threshold: achievement.threshold,
    tier: tier.tier,
    length: tier.length,
    points: tier.points,
    pointsSource: meta.pointsSource,
    gradeId: meta.gradeId,
  };
}
