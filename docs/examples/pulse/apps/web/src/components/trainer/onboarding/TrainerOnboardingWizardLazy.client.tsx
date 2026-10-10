"use client";

import dynamic from "next/dynamic";

import { TrainerRegisterPageSkeleton } from "@/components/trainer/onboarding/TrainerRegisterPageSkeleton";
import type { TrainerOnboardingWizardProps } from "@/components/trainer/onboarding/TrainerOnboardingWizard.client";

const TrainerOnboardingWizard = dynamic(
  () =>
    import("@/components/trainer/onboarding/TrainerOnboardingWizard.client").then(
      (module) => ({ default: module.TrainerOnboardingWizard }),
    ),
  { loading: () => <TrainerRegisterPageSkeleton /> },
);

export function TrainerOnboardingWizardLazy(props: TrainerOnboardingWizardProps) {
  return <TrainerOnboardingWizard {...props} />;
}
