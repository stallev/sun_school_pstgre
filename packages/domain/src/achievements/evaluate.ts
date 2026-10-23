import { ACHIEVEMENT_METRIC, ACHIEVEMENT_RULE_TYPE, type AchievementFactState } from "./constants";
import { buildAchievementAwardKey } from "./award-key";

export type AchievementEvaluateFact = {
  factId: string;
  state: AchievementFactState;
  /** Lesson check points (excludes achievement bonus) — for `lesson_points_sum`. */
  lessonPoints?: number;
};

export type AchievementEvaluateTier = {
  tier: number;
  length: number;
  points: number;
};

export type AchievementEvaluateRule = {
  achievementId: string;
  ruleType: (typeof ACHIEVEMENT_RULE_TYPE)[keyof typeof ACHIEVEMENT_RULE_TYPE];
  metric: string | null;
  isActive: boolean;
  tiers: readonly AchievementEvaluateTier[];
};

export type AchievementExistingAward = {
  achievementId: string;
  tier: number;
  evidenceFactIds: readonly string[];
  academicYearId: string;
  revokedAt?: string | null;
};

export type AchievementProposedAward = {
  achievementId: string;
  tier: number;
  points: number;
  evidenceFactIds: readonly string[];
  awardKey: string;
};

export type EvaluateAchievementsContext = {
  pupilId: string;
  academicYearId: string;
};

function extractSeries(facts: readonly AchievementEvaluateFact[]): string[][] {
  const segments: string[][] = [];
  let current: string[] = [];

  for (const fact of facts) {
    if (fact.state === "credited") {
      current.push(fact.factId);
    } else if (fact.state === "not_credited") {
      if (current.length > 0) {
        segments.push(current);
        current = [];
      }
    }
  }
  if (current.length > 0) {
    segments.push(current);
  }
  return segments;
}

function evidenceIntersectsSeries(evidenceFactIds: readonly string[], seriesFactIds: readonly string[]): boolean {
  const seriesSet = new Set(seriesFactIds);
  return evidenceFactIds.some((id) => seriesSet.has(id));
}

function hasSeriesAward(
  achievementId: string,
  tier: number,
  seriesFactIds: readonly string[],
  awards: readonly AchievementExistingAward[],
): boolean {
  return awards.some(
    (award) =>
      award.achievementId === achievementId &&
      award.tier === tier &&
      evidenceIntersectsSeries(award.evidenceFactIds, seriesFactIds),
  );
}

function hasYearLevelAward(
  achievementId: string,
  tier: number,
  academicYearId: string,
  awards: readonly AchievementExistingAward[],
): boolean {
  return awards.some(
    (award) =>
      award.achievementId === achievementId && award.tier === tier && award.academicYearId === academicYearId,
  );
}

function creditedFactsInOrder(facts: readonly AchievementEvaluateFact[]): AchievementEvaluateFact[] {
  return facts.filter((fact) => fact.state === "credited");
}

function evidenceForPointsAccumulation(
  facts: readonly AchievementEvaluateFact[],
  threshold: number,
): string[] | null {
  let sum = 0;
  const evidence: string[] = [];
  for (const fact of creditedFactsInOrder(facts)) {
    const points = fact.lessonPoints ?? 0;
    evidence.push(fact.factId);
    sum += points;
    if (sum >= threshold) {
      return evidence;
    }
  }
  return null;
}

function proposeSeriesAwards(
  rule: AchievementEvaluateRule,
  facts: readonly AchievementEvaluateFact[],
  awards: readonly AchievementExistingAward[],
  context: EvaluateAchievementsContext,
  proposed: AchievementProposedAward[],
): void {
  const segments = extractSeries(facts);
  const sortedTiers = [...rule.tiers].sort((a, b) => a.length - b.length);

  for (const segment of segments) {
    for (const tierDef of sortedTiers) {
      if (segment.length < tierDef.length) {
        continue;
      }
      const evidence = segment.slice(0, tierDef.length);
      const allAwards = [...awards, ...proposed] as AchievementExistingAward[];
      if (hasSeriesAward(rule.achievementId, tierDef.tier, segment, allAwards)) {
        continue;
      }
      proposed.push({
        achievementId: rule.achievementId,
        tier: tierDef.tier,
        points: tierDef.points,
        evidenceFactIds: evidence,
        awardKey: buildAchievementAwardKey({
          pupilId: context.pupilId,
          achievementId: rule.achievementId,
          tier: tierDef.tier,
          academicYearId: context.academicYearId,
        }),
      });
    }
  }
}

function proposeCountAccumulation(
  rule: AchievementEvaluateRule,
  facts: readonly AchievementEvaluateFact[],
  awards: readonly AchievementExistingAward[],
  context: EvaluateAchievementsContext,
  proposed: AchievementProposedAward[],
): void {
  const credited = creditedFactsInOrder(facts);
  const sortedTiers = [...rule.tiers].sort((a, b) => a.length - b.length);

  for (const tierDef of sortedTiers) {
    if (credited.length < tierDef.length) {
      continue;
    }
    const allAwards = [...awards, ...proposed] as AchievementExistingAward[];
    if (hasYearLevelAward(rule.achievementId, tierDef.tier, context.academicYearId, allAwards)) {
      continue;
    }
    proposed.push({
      achievementId: rule.achievementId,
      tier: tierDef.tier,
      points: tierDef.points,
      evidenceFactIds: credited.slice(0, tierDef.length).map((f) => f.factId),
      awardKey: buildAchievementAwardKey({
        pupilId: context.pupilId,
        achievementId: rule.achievementId,
        tier: tierDef.tier,
        academicYearId: context.academicYearId,
      }),
    });
  }
}

function proposePointsAccumulation(
  rule: AchievementEvaluateRule,
  facts: readonly AchievementEvaluateFact[],
  awards: readonly AchievementExistingAward[],
  context: EvaluateAchievementsContext,
  proposed: AchievementProposedAward[],
): void {
  for (const tierDef of rule.tiers) {
    const allAwards = [...awards, ...proposed] as AchievementExistingAward[];
    if (hasYearLevelAward(rule.achievementId, tierDef.tier, context.academicYearId, allAwards)) {
      continue;
    }
    const evidence = evidenceForPointsAccumulation(facts, tierDef.length);
    if (!evidence) {
      continue;
    }
    proposed.push({
      achievementId: rule.achievementId,
      tier: tierDef.tier,
      points: tierDef.points,
      evidenceFactIds: evidence,
      awardKey: buildAchievementAwardKey({
        pupilId: context.pupilId,
        achievementId: rule.achievementId,
        tier: tierDef.tier,
        academicYearId: context.academicYearId,
      }),
    });
  }
}

function proposeOnce(
  rule: AchievementEvaluateRule,
  facts: readonly AchievementEvaluateFact[],
  awards: readonly AchievementExistingAward[],
  context: EvaluateAchievementsContext,
  proposed: AchievementProposedAward[],
): void {
  const first = creditedFactsInOrder(facts)[0];
  if (!first) {
    return;
  }
  for (const tierDef of rule.tiers) {
    const allAwards = [...awards, ...proposed] as AchievementExistingAward[];
    if (hasYearLevelAward(rule.achievementId, tierDef.tier, context.academicYearId, allAwards)) {
      continue;
    }
    proposed.push({
      achievementId: rule.achievementId,
      tier: tierDef.tier,
      points: tierDef.points,
      evidenceFactIds: [first.factId],
      awardKey: buildAchievementAwardKey({
        pupilId: context.pupilId,
        achievementId: rule.achievementId,
        tier: tierDef.tier,
        academicYearId: context.academicYearId,
      }),
    });
  }
}

/**
 * Pure evaluate — achievements_and_penalties_contract §6.2, achievements_spec §7.2.
 */
export function evaluateAchievements(
  facts: readonly AchievementEvaluateFact[],
  rules: readonly AchievementEvaluateRule[],
  awards: readonly AchievementExistingAward[],
  context: EvaluateAchievementsContext,
): AchievementProposedAward[] {
  const proposed: AchievementProposedAward[] = [];

  for (const rule of rules) {
    if (!rule.isActive || rule.ruleType === ACHIEVEMENT_RULE_TYPE.MANUAL) {
      continue;
    }

    switch (rule.ruleType) {
      case ACHIEVEMENT_RULE_TYPE.SERIES:
        proposeSeriesAwards(rule, facts, awards, context, proposed);
        break;
      case ACHIEVEMENT_RULE_TYPE.ACCUMULATION:
        if (rule.metric === ACHIEVEMENT_METRIC.LESSON_POINTS_SUM) {
          proposePointsAccumulation(rule, facts, awards, context, proposed);
        } else {
          proposeCountAccumulation(rule, facts, awards, context, proposed);
        }
        break;
      case ACHIEVEMENT_RULE_TYPE.ONCE:
        proposeOnce(rule, facts, awards, context, proposed);
        break;
      default:
        break;
    }
  }

  return proposed;
}
