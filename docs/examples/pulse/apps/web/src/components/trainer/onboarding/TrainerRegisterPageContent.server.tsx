import { redirect } from "next/navigation";

import { TRAINER_STATUS, USER_ROLE } from "@pulse/domain";
import { getRoleHome } from "@pulse/policy-edge";

import { TrainerOnboardingWizard } from "@/components/trainer/onboarding/TrainerOnboardingWizard.client";
import {
  getTrainerOnboardingDraft,
  type TrainerOnboardingDraft,
} from "@/data/trainer/get-trainer-onboarding-draft.server";
import { auth } from "@/auth";

type TrainerRegisterPageContentProps = {
  searchParams: Promise<{ step?: string }>;
};

const EMPTY_TRAINER_ONBOARDING_DRAFT: TrainerOnboardingDraft = {
  profileId: null,
  timezone: "",
  photoUrl: null,
  bio: "",
  experienceYears: null,
  specializationSlugs: [],
  certificates: [],
  services: [],
  submittedAt: null,
  status: null,
};

export async function TrainerRegisterPageContent({
  searchParams,
}: TrainerRegisterPageContentProps) {
  const session = await auth();
  const params = await searchParams;
  const initialStep = params.step ? Number(params.step) : 1;

  if (session?.user?.role === USER_ROLE.CLIENT) {
    redirect(getRoleHome(USER_ROLE.CLIENT));
  }

  const draft = session?.user?.id
    ? await getTrainerOnboardingDraft(session.user.id)
    : EMPTY_TRAINER_ONBOARDING_DRAFT;

  if (draft.status === TRAINER_STATUS.APPROVED) {
    redirect("/trainer/dashboard");
  }

  if (draft.submittedAt) {
    redirect("/trainer/dashboard");
  }

  return (
    <TrainerOnboardingWizard
      isAuthenticated={Boolean(session?.user?.id)}
      userRole={
        session?.user?.role === USER_ROLE.TRAINER ? USER_ROLE.TRAINER : null
      }
      draft={draft}
      initialStep={Number.isFinite(initialStep) ? initialStep : 1}
    />
  );
}
