import { z } from "zod";

import { SPECIALIZATION_SLUGS } from "../constants/specialization-slugs";

export const saveOnboardingStep2Schema = z.object({
  bio: z
    .string()
    .min(100, "Bio must be at least 100 characters")
    .max(1000)
    .optional()
    .or(z.literal("")),
  specializationSlugs: z.array(z.enum(SPECIALIZATION_SLUGS)).default([]),
  experienceYears: z.number().int().min(0).max(60).optional(),
});

export type SaveOnboardingStep2Input = z.infer<typeof saveOnboardingStep2Schema>;
