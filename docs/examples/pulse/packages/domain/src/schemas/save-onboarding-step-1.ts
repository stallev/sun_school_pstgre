import { z } from "zod";

import { TRAINER_TIMEZONES } from "../constants/trainer-timezones";

export const saveOnboardingStep1Schema = z.object({
  timezone: z.enum(TRAINER_TIMEZONES),
  photoFileAssetId: z.string().uuid().optional(),
});

export type SaveOnboardingStep1Input = z.infer<typeof saveOnboardingStep1Schema>;
