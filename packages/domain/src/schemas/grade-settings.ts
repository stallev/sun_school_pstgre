import { z } from "zod";
import {
  isValidMaxVersesPerLesson,
  MAX_VERSES_PER_LESSON_MAX,
  MAX_VERSES_PER_LESSON_MIN,
} from "../school/grade-settings";

const scoreWeightSchema = z.number().int().min(0);

const weightsSchema = z.record(z.string(), scoreWeightSchema);

export const updateGradeSettingsInputSchema = z
  .object({
    gradeId: z.uuid(),
    yearId: z.uuid(),
    useVerses: z.boolean(),
    useTest: z.boolean(),
    useNotebook: z.boolean(),
    useSinging: z.boolean(),
    maxVersesPerLesson: z
      .number()
      .int()
      .min(MAX_VERSES_PER_LESSON_MIN, { error: "admin.group.settings_max_verses" })
      .max(MAX_VERSES_PER_LESSON_MAX, { error: "admin.group.settings_max_verses" })
      .refine(isValidMaxVersesPerLesson, { error: "admin.group.settings_max_verses" }),
    labels: z.record(z.string(), z.string()),
    weights: weightsSchema,
    recitationDaysN: z.number().int().min(1).max(30),
  })
  .strict();

export type UpdateGradeSettingsInput = z.infer<typeof updateGradeSettingsInputSchema>;
