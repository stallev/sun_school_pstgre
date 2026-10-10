import { Suspense } from "react";

import { TrainerProfileDetails } from "@/components/trainer/TrainerProfileDetails.server";
import { TrainerProfileDetailsSkeleton } from "@/components/trainer/TrainerProfileDetailsSkeleton";
import { TrainerProfileHeader } from "@/components/trainer/TrainerProfileHeader";
import { getPublicTrainerProfile } from "@/data/trainer/get-public-trainer-profile.server";

export type TrainerProfilePageBodyProps = {
  trainerId: string;
};

export async function TrainerProfilePageBody({
  trainerId,
}: TrainerProfilePageBodyProps) {
  const profile = await getPublicTrainerProfile(trainerId);

  return (
    <div className="space-y-4 pb-28 md:pb-8">
      <TrainerProfileHeader profile={profile} />

      <Suspense fallback={<TrainerProfileDetailsSkeleton />}>
        <TrainerProfileDetails profile={profile} />
      </Suspense>
    </div>
  );
}
