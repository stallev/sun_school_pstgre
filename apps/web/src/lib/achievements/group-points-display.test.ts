import { describe, expect, it } from "vitest";
import type { GroupPointsTableRowDto } from "@/data/achievements/load-group-points-page.server";
import { formatGroupPointsDisplay, formatGlobalPoints } from "@/lib/achievements/group-points-display";

const row = (overridePoints: number | null, globalPoints = 10): GroupPointsTableRowDto => ({
  rowKey: "ach-1:1",
  achievementId: "ach-1",
  tier: 1,
  achievementName: "Test",
  tierLabel: "I",
  conditionLabel: "5",
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
