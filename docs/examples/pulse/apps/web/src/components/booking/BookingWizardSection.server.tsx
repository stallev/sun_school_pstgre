import { BookingWizard } from "@/components/booking/BookingWizard.client";
import { getPublicTrainerProfile } from "@/data/trainer/get-public-trainer-profile.server";
import { BOOKING_WIZARD_STEP } from "@/lib/booking/booking-wizard-utils";

type BookingWizardSectionProps = {
  params: Promise<{ trainerId: string }>;
  searchParams: Promise<{ serviceId?: string; step?: string }>;
};

function parseInitialStep(value: string | undefined): number {
  const step = Number(value);
  if (step === BOOKING_WIZARD_STEP.slot || step === BOOKING_WIZARD_STEP.confirm) {
    return step;
  }

  return BOOKING_WIZARD_STEP.service;
}

export async function BookingWizardSection({
  params,
  searchParams,
}: BookingWizardSectionProps) {
  const { trainerId } = await params;
  const query = await searchParams;
  const profile = await getPublicTrainerProfile(trainerId);

  return (
    <BookingWizard
      profile={profile}
      initialServiceId={query.serviceId ?? profile.defaultServiceId}
      initialStep={parseInitialStep(query.step)}
    />
  );
}
