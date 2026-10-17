import { z } from "zod";
import { APP_LOCALE } from "../constants/enums";

const groupNameSchema = z.string().trim().min(1, { error: "admin.group.name_required" }).max(100);

const ageSchema = z.number().int().min(0).max(25).nullable().optional();

export const createGroupInputSchema = z
  .object({
    name: groupNameSchema,
    description: z.string().trim().max(500).optional(),
    ageMin: ageSchema,
    ageMax: ageSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    const min = value.ageMin ?? null;
    const max = value.ageMax ?? null;
    if (min !== null && max !== null && min > max) {
      ctx.addIssue({
        code: "custom",
        message: "admin.group.age_range_invalid",
        path: ["ageMax"],
      });
    }
  });

export type CreateGroupInput = z.infer<typeof createGroupInputSchema>;

export const updateGroupInputSchema = z
  .object({
    gradeId: z.uuid(),
    name: groupNameSchema,
    description: z.string().trim().max(500).optional(),
    ageMin: ageSchema,
    ageMax: ageSchema,
    isActive: z.boolean(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const min = value.ageMin ?? null;
    const max = value.ageMax ?? null;
    if (min !== null && max !== null && min > max) {
      ctx.addIssue({
        code: "custom",
        message: "admin.group.age_range_invalid",
        path: ["ageMax"],
      });
    }
  });

export type UpdateGroupInput = z.infer<typeof updateGroupInputSchema>;

export const setGroupLanguageInputSchema = z
  .object({
    gradeId: z.uuid(),
    language: z.enum([APP_LOCALE.RU, APP_LOCALE.EN]),
  })
  .strict();

export type SetGroupLanguageInput = z.infer<typeof setGroupLanguageInputSchema>;

export const assignTeacherInputSchema = z
  .object({
    userId: z.uuid(),
    gradeId: z.uuid(),
    yearId: z.uuid(),
  })
  .strict();

export type AssignTeacherInput = z.infer<typeof assignTeacherInputSchema>;

export const unassignTeacherInputSchema = z
  .object({
    userId: z.uuid(),
    gradeId: z.uuid(),
    yearId: z.uuid(),
  })
  .strict();

export type UnassignTeacherInput = z.infer<typeof unassignTeacherInputSchema>;
