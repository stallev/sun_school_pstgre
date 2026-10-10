import { z } from "zod";

import { SPECIALIZATION_SLUGS } from "../constants/specialization-slugs";
import { TRAINER_TIMEZONES } from "../constants/trainer-timezones";
import { onboardingCertificateRowSchema } from "./save-onboarding-step-3";

export const updateTrainerProfileSchema = z.object({
  timezone: z.enum(TRAINER_TIMEZONES),
  photoFileAssetId: z.string().uuid().optional(),
  bio: z
    .string()
    .min(100, "Bio must be at least 100 characters")
    .max(1000)
    .optional()
    .or(z.literal("")),
  specializationSlugs: z.array(z.enum(SPECIALIZATION_SLUGS)).default([]),
  experienceYears: z.number().int().min(0).max(60).optional(),
  certificates: z.array(onboardingCertificateRowSchema).default([]),
});

export type UpdateTrainerProfileInput = z.infer<typeof updateTrainerProfileSchema>;
