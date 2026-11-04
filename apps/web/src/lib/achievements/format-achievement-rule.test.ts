import { describe, expect, it } from "vitest";
import { ACHIEVEMENT_KIND } from "@sunschool/domain";
import type { CatalogRowDto } from "@/lib/achievements/catalog-display";
import {
  formatAchievementDescriptionForDisplay,
  formatAchievementTierLine,
  LESSON_POINTS_SUM_METRIC,
} from "@/lib/achievements/format-achievement-rule";
import type { AchievementsCatalogMessages } from "@/lib/messages/pick-achievements-catalog-messages.server";

const baseMessages = (): AchievementsCatalogMessages =>
  ({
    tierAfterCondition: "{prefix}\u043F\u043E\u0441\u043B\u0435 {condition} \u2192 {bricks}",
    tierLabels: ["\u0411\u0440\u043E\u043D\u0437\u0430", "\u0421\u0435\u0440\u0435\u0431\u0440\u043E", "\u0417\u043E\u043B\u043E\u0442\u043E"],
    tierLessonsPlural: {
      one: "\u0443\u0440\u043E\u043A",
      few: "\u0443\u0440\u043E\u043A\u0430",
      many: "\u0443\u0440\u043E\u043A\u043E\u0432",
      other: "\u0443\u0440\u043E\u043A\u043E\u0432",
    },
    tierPointsPlural: {
      one: "\u0431\u0430\u043B\u043B",
      few: "\u0431\u0430\u043B\u043B\u0430",
      many: "\u0431\u0430\u043B\u043B\u043E\u0432",
      other: "\u0431\u0430\u043B\u043B\u043E\u0432",
    },
    tierBricksPlural: {
      one: "\u043A\u0438\u0440\u043F\u0438\u0447\u0438\u043A",
      few: "\u043A\u0438\u0440\u043F\u0438\u0447\u0438\u043A\u0430",
      many: "\u043A\u0438\u0440\u043F\u0438\u0447\u0438\u043A\u043E\u0432",
      other: "\u043A\u0438\u0440\u043F\u0438\u0447\u0438\u043A\u043E\u0432",
    },
  }) as AchievementsCatalogMessages;

const rewardRow = (metric: string | null, tiers: CatalogRowDto["tiers"]): CatalogRowDto =>
  ({
    id: "a1",
    code: "test",
    kind: ACHIEVEMENT_KIND.REWARD,
    nameRu: "Test",
    nameEn: "Test",
    descriptionRu: null,
    descriptionEn: null,
    category: "EFFORT",
    ruleType: "ACCUMULATION",
    metric,
    threshold: null,
    isActive: true,
    tiers,
    activePenaltyCount: 0,
    kindLocked: false,
  }) as CatalogRowDto;

describe("formatAchievementTierLine (P27-CU8)", () => {
  it("uses lesson plurals for default metrics (D-12)", () => {
    const line = formatAchievementTierLine(
      rewardRow("lesson_homework_done", [{ tier: 1, length: 1, points: 1 }]),
      { tier: 1, length: 1, points: 1 },
      baseMessages(),
      "ru",
    );
    expect(line).toBe("\u043F\u043E\u0441\u043B\u0435 1 \u0443\u0440\u043E\u043A \u2192 +1 \u043A\u0438\u0440\u043F\u0438\u0447\u0438\u043A");
  });

  it("uses points for hundred-bricks metric (D-11)", () => {
    const line = formatAchievementTierLine(
      rewardRow(LESSON_POINTS_SUM_METRIC, [{ tier: 1, length: 100, points: 10 }]),
      { tier: 1, length: 100, points: 10 },
      baseMessages(),
      "ru",
    );
    expect(line).toContain("100 \u0431\u0430\u043B\u043B\u043E\u0432");
    expect(line).not.toContain("\u0443\u0440\u043E\u043A");
  });

  it("formats tier prefix and brick plurals (D-12)", () => {
    const line = formatAchievementTierLine(
      rewardRow("verses_all_perfect", [
        { tier: 1, length: 5, points: 5 },
        { tier: 2, length: 10, points: 10 },
      ]),
      { tier: 1, length: 5, points: 5 },
      baseMessages(),
      "ru",
    );
    expect(line).toBe(
      "\u0411\u0440\u043E\u043D\u0437\u0430: \u043F\u043E\u0441\u043B\u0435 5 \u0443\u0440\u043E\u043A\u043E\u0432 \u2192 +5 \u043A\u0438\u0440\u043F\u0438\u0447\u0438\u043A\u043E\u0432",
    );
  });

  it("uses zero lesson and brick plurals (Paths N)", () => {
    const line = formatAchievementTierLine(
      rewardRow("lesson_homework_done", [{ tier: 1, length: 0, points: 0 }]),
      { tier: 1, length: 0, points: 0 },
      baseMessages(),
      "ru",
    );
    expect(line).toContain("0 \u0443\u0440\u043E\u043A\u043E\u0432");
    expect(line).toContain("+0 \u043A\u0438\u0440\u043F\u0438\u0447\u0438\u043A\u043E\u0432");
  });
});

describe("formatAchievementDescriptionForDisplay (P27-CU8)", () => {
  it("replaces practice window wording in ru (D-13)", () => {
    const text = "\u0421\u0442\u0438\u0445 \u0443\u0440\u043E\u043A\u0430 \u0440\u0430\u0441\u0441\u043A\u0430\u0437\u0430\u043D \u0433\u043E\u043B\u043E\u0441\u043E\u043C \u0432 \u0442\u0440\u0438 \u0440\u0430\u0437\u043D\u044B\u0445 \u0434\u043D\u044F \u043E\u043A\u043D\u0430";
    expect(formatAchievementDescriptionForDisplay(text, "ru")).toBe(
      "\u0421\u0442\u0438\u0445 \u0443\u0440\u043E\u043A\u0430 \u0440\u0430\u0441\u0441\u043A\u0430\u0437\u0430\u043D \u0433\u043E\u043B\u043E\u0441\u043E\u043C \u0432 \u0442\u0440\u0438 \u0440\u0430\u0437\u043D\u044B\u0445 \u0434\u043D\u044F \u0432 \u0442\u0435\u0447\u0435\u043D\u0438\u0435 \u043D\u0435\u0434\u0435\u043B\u0438",
    );
  });

  it("leaves text without double hyphen unchanged (D-20 path N)", () => {
    expect(formatAchievementDescriptionForDisplay("\u0411\u0435\u0437 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439.", "ru")).toBe(
      "\u0411\u0435\u0437 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439.",
    );
  });
});
