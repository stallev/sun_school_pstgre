import { describe, expect, it } from "vitest";
import { ACHIEVEMENT_FACT_STATE, ACHIEVEMENT_METRIC, ACHIEVEMENT_RULE_TYPE } from "./constants";
import {
  evaluateAchievements,
  type AchievementEvaluateFact,
  type AchievementEvaluateRule,
  type AchievementExistingAward,
} from "./evaluate";

const YEAR = "year-1";
const PUPIL = "pupil-1";
const NOTEBOOK = "ach-notebook";

const ctx = { pupilId: PUPIL, academicYearId: YEAR };

function notebookRule(overrides?: Partial<AchievementEvaluateRule>): AchievementEvaluateRule {
  return {
    achievementId: NOTEBOOK,
    ruleType: ACHIEVEMENT_RULE_TYPE.SERIES,
    metric: "notebook_score_gte_9",
    isActive: true,
    tiers: [
      { tier: 1, length: 3, points: 5 },
      { tier: 2, length: 5, points: 10 },
      { tier: 3, length: 10, points: 20 },
    ],
    ...overrides,
  };
}

function factsFromStates(states: AchievementEvaluateFact["state"][], prefix = "f"): AchievementEvaluateFact[] {
  return states.map((state, index) => ({ factId: `${prefix}${index + 1}`, state }));
}

function mergeAwards(
  existing: AchievementExistingAward[],
  newOnes: ReturnType<typeof evaluateAchievements>,
): AchievementExistingAward[] {
  return [
    ...existing,
    ...newOnes.map((award) => ({
      achievementId: award.achievementId,
      tier: award.tier,
      evidenceFactIds: [...award.evidenceFactIds],
      academicYearId: YEAR,
    })),
  ];
}

describe("evaluateAchievements (achievements_spec §7.3)", () => {
  it("is idempotent on the same facts and awards", () => {
    const facts = factsFromStates([
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
    ]);
    const first = evaluateAchievements(facts, [notebookRule()], [], ctx);
    expect(first).toHaveLength(1);
    expect(first[0]?.tier).toBe(1);
    const merged = mergeAwards([], first);
    const second = evaluateAchievements(facts, [notebookRule()], merged, ctx);
    expect(second).toHaveLength(0);
  });

  it("matches incremental vs single end-of-year recalculation", () => {
    const states = [
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
    ];
    let awards: AchievementExistingAward[] = [];
    const incremental: ReturnType<typeof evaluateAchievements> = [];
    for (let i = 1; i <= states.length; i += 1) {
      const slice = factsFromStates(states.slice(0, i));
      const batch = evaluateAchievements(slice, [notebookRule()], awards, ctx);
      incremental.push(...batch);
      awards = mergeAwards(awards, batch);
    }
    const atOnce = evaluateAchievements(factsFromStates(states), [notebookRule()], [], ctx);
    expect(incremental.map((a) => a.tier).sort()).toEqual(atOnce.map((a) => a.tier).sort());
  });

  it("does not duplicate bronze when a backdated fix merges series (spec §5)", () => {
    const before = factsFromStates([
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.NOT_CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
    ]);
    const awards = mergeAwards([], evaluateAchievements(before, [notebookRule()], [], ctx));
    expect(awards.filter((a) => a.tier === 1)).toHaveLength(2);

    const after = factsFromStates([
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
    ]);
    const next = evaluateAchievements(after, [notebookRule()], awards, ctx);
    expect(next.filter((a) => a.tier === 1)).toHaveLength(0);
    expect(next.some((a) => a.tier === 2)).toBe(true);
  });

  it("does not re-issue after revoke — evidence stays occupied (ДС-7)", () => {
    const facts = factsFromStates([
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
    ]);
    const awards: AchievementExistingAward[] = [
      {
        achievementId: NOTEBOOK,
        tier: 1,
        evidenceFactIds: ["f1", "f2", "f3"],
        academicYearId: YEAR,
        revokedAt: "2026-01-01T00:00:00Z",
      },
    ];
    expect(evaluateAchievements(facts, [notebookRule()], awards, ctx)).toHaveLength(0);
  });

  it("blocks auto award when manual award occupies lessons (spec §5)", () => {
    const facts = factsFromStates([
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
    ]);
    const awards: AchievementExistingAward[] = [
      {
        achievementId: NOTEBOOK,
        tier: 1,
        evidenceFactIds: ["f6", "f7", "f8"],
        academicYearId: YEAR,
      },
    ];
    const extended = [
      ...facts,
      { factId: "f9", state: ACHIEVEMENT_FACT_STATE.CREDITED },
    ];
    const next = evaluateAchievements(extended, [notebookRule()], awards, ctx);
    expect(next.some((a) => a.tier === 1 && a.evidenceFactIds.includes("f6"))).toBe(false);
  });

  it("treats skip between credited lessons as same series (ДС-1)", () => {
    const facts = factsFromStates([
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.SKIP,
      ACHIEVEMENT_FACT_STATE.CREDITED,
    ]);
    const awards = evaluateAchievements(facts, [notebookRule()], [], ctx);
    expect(awards[0]?.evidenceFactIds).toEqual(["f1", "f2", "f4"]);
  });

  it("overview lesson: skip for verses, credited for notebook (ДС-15)", () => {
    const verses: AchievementEvaluateRule = {
      achievementId: "verses",
      ruleType: ACHIEVEMENT_RULE_TYPE.SERIES,
      metric: "verses_all_perfect",
      isActive: true,
      tiers: [{ tier: 1, length: 3, points: 10 }],
    };
    const verseFacts = factsFromStates(
      [
        ACHIEVEMENT_FACT_STATE.CREDITED,
        ACHIEVEMENT_FACT_STATE.SKIP,
        ACHIEVEMENT_FACT_STATE.CREDITED,
        ACHIEVEMENT_FACT_STATE.CREDITED,
      ],
      "v",
    );
    const verseAwards = evaluateAchievements(verseFacts, [verses], [], ctx);
    expect(verseAwards[0]?.evidenceFactIds).toEqual(["v1", "v3", "v4"]);

    const notebookFacts = factsFromStates(
      [
        ACHIEVEMENT_FACT_STATE.CREDITED,
        ACHIEVEMENT_FACT_STATE.CREDITED,
        ACHIEVEMENT_FACT_STATE.CREDITED,
      ],
      "n",
    );
    expect(
      evaluateAchievements(
        notebookFacts,
        [notebookRule({ tiers: [{ tier: 1, length: 3, points: 5 }] })],
        [],
        ctx,
      ),
    ).toHaveLength(1);
  });

  it("treats disabled-period lessons as skip (ДС-14)", () => {
    const facts = factsFromStates([
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.SKIP,
      ACHIEVEMENT_FACT_STATE.SKIP,
      ACHIEVEMENT_FACT_STATE.CREDITED,
      ACHIEVEMENT_FACT_STATE.CREDITED,
    ]);
    const awards = evaluateAchievements(facts, [notebookRule()], [], ctx);
    expect(awards[0]?.evidenceFactIds).toEqual(["f1", "f4", "f5"]);
  });

  it("skips inactive practice catalog row (contract §6.1)", () => {
    const facts = factsFromStates([ACHIEVEMENT_FACT_STATE.CREDITED, ACHIEVEMENT_FACT_STATE.CREDITED]);
    const practice: AchievementEvaluateRule = {
      achievementId: "practice",
      ruleType: ACHIEVEMENT_RULE_TYPE.ACCUMULATION,
      metric: "verse_voice_three_days",
      isActive: false,
      tiers: [{ tier: 1, length: 1, points: 3 }],
    };
    expect(evaluateAchievements(facts, [practice], [], ctx)).toHaveLength(0);
  });

  it("awards hundred by lesson points sum, not lesson count (ДС-10)", () => {
    const hundred: AchievementEvaluateRule = {
      achievementId: "hundred",
      ruleType: ACHIEVEMENT_RULE_TYPE.ACCUMULATION,
      metric: ACHIEVEMENT_METRIC.LESSON_POINTS_SUM,
      isActive: true,
      tiers: [{ tier: 1, length: 100, points: 10 }],
    };
    const fewLessonsHighPoints: AchievementEvaluateFact[] = [
      { factId: "a", state: ACHIEVEMENT_FACT_STATE.CREDITED, lessonPoints: 60 },
      { factId: "b", state: ACHIEVEMENT_FACT_STATE.CREDITED, lessonPoints: 50 },
    ];
    expect(evaluateAchievements(fewLessonsHighPoints, [hundred], [], ctx)).toHaveLength(1);
    expect(fewLessonsHighPoints).toHaveLength(2);

    const manyLessonsLowPoints: AchievementEvaluateFact[] = Array.from({ length: 20 }, (_, i) => ({
      factId: `l${i}`,
      state: ACHIEVEMENT_FACT_STATE.CREDITED,
      lessonPoints: 4,
    }));
    expect(evaluateAchievements(manyLessonsLowPoints, [hundred], [], ctx)).toHaveLength(0);
  });
});
