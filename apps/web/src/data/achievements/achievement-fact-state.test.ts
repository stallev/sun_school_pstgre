import { describe, expect, it } from "vitest";
import { ACHIEVEMENT_FACT_STATE, LESSON_KIND } from "@sunschool/domain";
import { buildAchievementEvaluateFacts, type AchievementCheckFactRow } from "./achievement-fact-state.server";

const baseRow = (overrides: Partial<AchievementCheckFactRow>): AchievementCheckFactRow => ({
  checkId: "check-1",
  lessonKind: LESSON_KIND.REGULAR,
  lessonHasTest: true,
  lessonInOffPeriod: false,
  homeworkChecked: true,
  testScore: 9,
  notebookScore: 10,
  singing: false,
  verseScores: [2, 2],
  lessonPoints: 12,
  ...overrides,
});

describe("buildAchievementEvaluateFacts", () => {
  it("marks overview lesson as skip for verses and credited for notebook (ДС-15)", () => {
    const row = baseRow({ lessonKind: LESSON_KIND.REVIEW });
    const facts = buildAchievementEvaluateFacts([row], ["verses_all_perfect", "notebook_score_gte_9"]);
    expect(facts.get("verses_all_perfect")?.[0]?.state).toBe(ACHIEVEMENT_FACT_STATE.SKIP);
    expect(facts.get("notebook_score_gte_9")?.[0]?.state).toBe(ACHIEVEMENT_FACT_STATE.CREDITED);
  });
});
