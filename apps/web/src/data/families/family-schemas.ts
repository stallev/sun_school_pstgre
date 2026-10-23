import { z } from "zod";
import { ADULT_RELATION } from "@sunschool/domain";
import { personNameSchema } from "@sunschool/domain";

const familyNameSchema = z.string().trim().min(1, "admin.family.name_required");

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value))
  .optional();

const phonesSchema = z.array(z.string().trim().min(1)).default([]);

const emailSchema = z
  .string()
  .trim()
  .email("admin.family.email_invalid")
  .or(z.literal(""))
  .transform((value) => (value === "" ? undefined : value))
  .optional();

export const upsertFamilyInputSchema = z
  .object({
    familyId: z.string().uuid(),
    name: familyNameSchema,
    address: optionalText,
    note: optionalText,
  })
  .strict();

export const addFamilyAdultInputSchema = z
  .object({
    familyId: z.string().uuid().optional(),
    familyName: familyNameSchema.optional(),
    address: optionalText,
    note: optionalText,
    relation: z.enum([
      ADULT_RELATION.MOTHER,
      ADULT_RELATION.FATHER,
      ADULT_RELATION.GUARDIAN,
    ]),
    lastName: personNameSchema.shape.lastName,
    firstName: personNameSchema.shape.firstName,
    middleName: personNameSchema.shape.middleName,
    phones: phonesSchema,
    email: emailSchema,
    userId: z.string().uuid().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.familyId && !value.familyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "admin.family.name_required",
        path: ["familyName"],
      });
    }
  });

export const updateFamilyAdultInputSchema = z
  .object({
    adultId: z.string().uuid(),
    relation: z.enum([
      ADULT_RELATION.MOTHER,
      ADULT_RELATION.FATHER,
      ADULT_RELATION.GUARDIAN,
    ]),
    lastName: personNameSchema.shape.lastName,
    firstName: personNameSchema.shape.firstName,
    middleName: personNameSchema.shape.middleName,
    phones: phonesSchema,
    email: emailSchema,
    userId: z.string().uuid().nullable().optional(),
  })
  .strict();

export const removeFamilyAdultInputSchema = z
  .object({
    adultId: z.string().uuid(),
  })
  .strict();

export const attachFamilyPupilInputSchema = z
  .object({
    familyId: z.string().uuid(),
    pupilId: z.string().uuid(),
  })
  .strict();

export const transferFamilyPupilInputSchema = z
  .object({
    pupilId: z.string().uuid(),
    targetFamilyId: z.string().uuid(),
  })
  .strict();

export const mergeFamiliesInputSchema = z
  .object({
    sourceFamilyId: z.string().uuid(),
    targetFamilyId: z.string().uuid(),
  })
  .strict()
  .refine((value) => value.sourceFamilyId !== value.targetFamilyId, {
    message: "admin.family.merge_same",
    path: ["targetFamilyId"],
  });
