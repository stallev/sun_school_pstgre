import { z } from "zod";
import { MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";

/** Penalty row in `grade_achievement_points` (ADR-015 §4). */
export const GROUP_ACHIEVEMENT_PENALTY_TIER = 0;

export const GROUP_ACHIEVEMENT_POINTS_MAX_ITEMS = 64;

const groupAchievementPointsItemSchema = z
  .object({
    achievementId: z.uuid(),
    tier: z
      .number({ error: MUTATION_ERROR_CODES.VALIDATION })
      .int({ error: MUTATION_ERROR_CODES.VALIDATION })
      .min(0, { error: MUTATION_ERROR_CODES.VALIDATION })
      .max(3, { error: MUTATION_ERROR_CODES.VALIDATION }),
    points: z
      .number({ error: MUTATION_ERROR_CODES.VALIDATION })
      .int({ error: MUTATION_ERROR_CODES.VALIDATION })
      .nullable(),
  })
  .strict();

export type GroupAchievementPointsItem = z.infer<typeof groupAchievementPointsItemSchema>;

/** achievement_group_points_contract §5 — `setGroupAchievementPoints` package (server + form). */
export const setGroupAchievementPointsInputSchema = z
  .object({
    gradeId: z.uuid(),
    academicYearId: z.uuid(),
    items: z
      .array(groupAchievementPointsItemSchema)
      .min(1, { error: MUTATION_ERROR_CODES.VALIDATION })
      .max(GROUP_ACHIEVEMENT_POINTS_MAX_ITEMS, { error: MUTATION_ERROR_CODES.VALIDATION }),
  })
  .strict()
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    for (const [index, item] of value.items.entries()) {
      const key = `${item.achievementId}:${item.tier}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: MUTATION_ERROR_CODES.VALIDATION,
          path: ["items", index],
        });
        continue;
      }
      seen.add(key);

      if (item.points === null) {
        continue;
      }

      const isPenalty = item.tier === GROUP_ACHIEVEMENT_PENALTY_TIER;
      const invalidSign =
        (isPenalty && item.points >= 0) || (!isPenalty && item.points < 0);
      if (invalidSign) {
        ctx.addIssue({
          code: "custom",
          message: MUTATION_ERROR_CODES.ACHIEVEMENT_GROUP_POINTS_INVALID,
          path: ["items", index, "points"],
        });
      }
    }
  });

export type SetGroupAchievementPointsInput = z.infer<typeof setGroupAchievementPointsInputSchema>;

export const parseSetGroupAchievementPointsInput = (raw: unknown) =>
  setGroupAchievementPointsInputSchema.safeParse(raw);
