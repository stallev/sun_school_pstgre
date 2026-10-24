import { describe, expect, it } from "vitest";
import { MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import { resolveEffectivePoints } from "./effective-points";
import {
  GROUP_ACHIEVEMENT_PENALTY_TIER,
  GROUP_ACHIEVEMENT_POINTS_MAX_ITEMS,
  parseSetGroupAchievementPointsInput,
} from "./group-points-schema";

const ACHIEVEMENT_ID = "00000000-0000-4000-8000-000000000001";
const GRADE_ID = "00000000-0000-4000-8000-000000000002";
const YEAR_ID = "00000000-0000-4000-8000-000000000003";

describe("resolveEffectivePoints", () => {
  it("returns global when override is undefined", () => {
    expect(resolveEffectivePoints(10, undefined)).toBe(10);
  });

  it("returns override when set, including zero reward", () => {
    expect(resolveEffectivePoints(10, 0)).toBe(0);
    expect(resolveEffectivePoints(10, 25)).toBe(25);
  });
});

describe("setGroupAchievementPointsInputSchema", () => {
  const baseItem = { achievementId: ACHIEVEMENT_ID, tier: 1, points: 5 };

  const parse = (items: { achievementId: string; tier: number; points: number | null }[]) =>
    parseSetGroupAchievementPointsInput({
      gradeId: GRADE_ID,
      academicYearId: YEAR_ID,
      items,
    });

  it("accepts a valid reward package", () => {
    expect(parse([baseItem]).success).toBe(true);
  });

  it("accepts null points as reset", () => {
    expect(parse([{ ...baseItem, points: null }]).success).toBe(true);
  });

  it("accepts penalty tier with negative points", () => {
    expect(parse([{ achievementId: ACHIEVEMENT_ID, tier: GROUP_ACHIEVEMENT_PENALTY_TIER, points: -3 }]).success).toBe(
      true,
    );
  });

  it("rejects duplicate (achievementId, tier)", () => {
    const result = parse([baseItem, baseItem]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === MUTATION_ERROR_CODES.VALIDATION)).toBe(true);
    }
  });

  it("rejects more than 64 items", () => {
    const items = Array.from({ length: GROUP_ACHIEVEMENT_POINTS_MAX_ITEMS + 1 }, (_, i) => ({
      achievementId: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      tier: 1,
      points: 1,
    }));
    const result = parse(items);
    expect(result.success).toBe(false);
  });

  it("rejects reward with negative points", () => {
    const result = parse([{ ...baseItem, points: -1 }]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message === MUTATION_ERROR_CODES.ACHIEVEMENT_GROUP_POINTS_INVALID),
      ).toBe(true);
    }
  });

  it("rejects penalty with non-negative points", () => {
    const result = parse([{ achievementId: ACHIEVEMENT_ID, tier: GROUP_ACHIEVEMENT_PENALTY_TIER, points: 0 }]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message === MUTATION_ERROR_CODES.ACHIEVEMENT_GROUP_POINTS_INVALID),
      ).toBe(true);
    }
  });
});
