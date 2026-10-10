import { z } from "zod";

export const onboardingServiceRowSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  durationMinutes: z.number().int().min(15).max(480),
  priceCents: z.number().int().min(0),
  description: z.string().max(500).optional(),
});

export const saveOnboardingStep4Schema = z.object({
  services: z.array(onboardingServiceRowSchema).default([]),
});

export type OnboardingServiceRow = z.infer<typeof onboardingServiceRowSchema>;
export type SaveOnboardingStep4Input = z.infer<typeof saveOnboardingStep4Schema>;
