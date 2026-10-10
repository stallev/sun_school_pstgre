import { z } from "zod";

import { onboardingServiceRowSchema } from "./save-onboarding-step-4";

export const createTrainerServiceSchema = onboardingServiceRowSchema.omit({ id: true });

export const updateTrainerServiceSchema = onboardingServiceRowSchema.extend({
  id: z.string().uuid(),
});

export type CreateTrainerServiceInput = z.infer<typeof createTrainerServiceSchema>;
export type UpdateTrainerServiceInput = z.infer<typeof updateTrainerServiceSchema>;
