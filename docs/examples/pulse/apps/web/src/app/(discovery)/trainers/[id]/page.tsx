import { Suspense } from "react";
import type { Metadata } from "next";

import { TrainerProfileMain } from "@/components/trainer/TrainerProfileMain.server";
import { TrainerProfileMainSkeleton } from "@/components/trainer/TrainerProfileMainSkeleton";
import { getPublicTrainerProfile } from "@/data/trainer/get-public-trainer-profile.server";
import { getMessages } from "@/lib/messages/server";

type TrainerProfilePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: TrainerProfilePageProps): Promise<Metadata> {
  const messages = await getMessages();
  const { id } = await params;
  const profile = await getPublicTrainerProfile(id);

  return {
    title: messages.trainer.profile.metaTitle.replace("{name}", profile.fullName),
    description: messages.trainer.profile.metaDescription.replace(
      "{name}",
      profile.fullName,
    ),
  };
}

export default async function TrainerProfilePage({
  params,
}: TrainerProfilePageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<TrainerProfileMainSkeleton />}>
      <TrainerProfileMain trainerId={id} />
    </Suspense>
  );
}
