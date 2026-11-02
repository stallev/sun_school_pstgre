import { describe, expect, it } from "vitest";
import type { GroupPointsTableRowDto } from "@/data/achievements/load-group-points-page.server";
import { ACHIEVEMENT_RULE_TYPE } from "@sunschool/domain";
import {
  formatGlobalPoints,
  formatGroupPointsCondition,
  formatGroupPointsDisplay,
} from "@/lib/achievements/group-points-display";
import type { GroupPointsMessages } from "@/lib/messages/group-points-messages";

const row = (overridePoints: number | null, globalPoints = 10): GroupPointsTableRowDto => ({
  rowKey: "ach-1:1",
  achievementId: "ach-1",
  tier: 1,
  achievementName: "Test",
  tierLabel: "I",
  conditionLabel: "5",
  ruleType: "SERIES",
  tierLength: 5,
  description: null,
  isActive: true,
  globalPoints,
  overridePoints,
  isPenalty: false,
  readOnly: false,
});

describe("formatGroupPointsDisplay", () => {
  it("shows override value instead of global when group override is set", () => {
    const withOverride = row(3, 10);
    expect(formatGlobalPoints(withOverride)).toBe("+10");
    expect(formatGroupPointsDisplay(withOverride)).toBe("+3");
  });
});

describe("formatGroupPointsCondition", () => {
  const messages = {
    conditionSeries: "{length} in a row",
    conditionAccumulation: "{length} in total",
    conditionOnce: "Once",
    conditionEvent: "Each recital",
  } as GroupPointsMessages;

  it("formats each reward rule type with its tier length", () => {
    expect(formatGroupPointsCondition(row(null), messages)).toBe("5 in a row");
    expect(
      formatGroupPointsCondition(
        { ...row(null), ruleType: ACHIEVEMENT_RULE_TYPE.ACCUMULATION },
        messages,
      ),
    ).toBe("5 in total");
    expect(
      formatGroupPointsCondition({ ...row(null), ruleType: ACHIEVEMENT_RULE_TYPE.ONCE }, messages),
    ).toBe("Once");
    expect(
      formatGroupPointsCondition({ ...row(null), ruleType: ACHIEVEMENT_RULE_TYPE.EVENT }, messages),
    ).toBe("Each recital");
  });

  it("keeps the catalog text for penalties", () => {
    const penalty = { ...row(null), ruleType: null, tierLength: null, conditionLabel: "Rude" };
    expect(formatGroupPointsCondition(penalty, messages)).toBe("Rude");
  });
});
