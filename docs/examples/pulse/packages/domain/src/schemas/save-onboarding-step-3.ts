import { z } from "zod";

export const onboardingCertificateRowSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  fileAssetId: z.string().uuid().optional(),
});

export const saveOnboardingStep3Schema = z.object({
  certificates: z.array(onboardingCertificateRowSchema).default([]),
});

export type OnboardingCertificateRow = z.infer<typeof onboardingCertificateRowSchema>;
export type SaveOnboardingStep3Input = z.infer<typeof saveOnboardingStep3Schema>;
