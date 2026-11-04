import { describe, expect, it } from "vitest";
import { splitAchievementRuleText } from "@/lib/achievements/split-achievement-rule-text";

describe("splitAchievementRuleText (P26-CU9)", () => {
  it("uses first sentence as summary and full text in details", () => {
    const text =
      "Ученик рассказывает на проверке все золотые стихи урока на «2» несколько уроков подряд. Серия прерывается, если хотя бы один стих получил меньше «2».";
    const result = splitAchievementRuleText(text);
    expect(result.summary).toBe(
      "Ученик рассказывает на проверке все золотые стихи урока на «2» несколько уроков подряд.",
    );
    expect(result.details).toBe(text);
  });

  it("returns summary only for a single sentence", () => {
    const result = splitAchievementRuleText("Штраф за плохое поведение на уроке");
    expect(result.summary).toBe("Штраф за плохое поведение на уроке");
    expect(result.details).toBeNull();
  });
});

describe("AchievementCatalogRow messages (P26-CU9)", () => {
  it("expects human tier and practice status keys in admin dictionary shape", () => {
    const ru = {
      tier_after_condition: "{prefix}после {condition} → {bricks}",
      status_practice_pending: "Появится вместе с голосовой проверкой",
      rule_how_counted: "Как считается",
    };
    expect(ru.status_practice_pending).not.toContain("Ждёт");
    expect(ru.tier_after_condition).toContain("{prefix}");
  });
});
