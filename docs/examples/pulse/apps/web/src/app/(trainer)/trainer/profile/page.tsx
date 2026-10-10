import type { Metadata } from "next";

import { TrainerProfileEditForm } from "@/components/trainer/TrainerProfileEditForm.client";
import { getTrainerProfileForEdit } from "@/data/trainer/get-trainer-profile-for-edit.server";
import { getMessages } from "@/lib/messages/server";


export async function generateMetadata(): Promise<Metadata> {
  const messages = await getMessages();
  return {
    title: messages.trainer.editProfile.metaTitle,
  };
}

export default async function TrainerProfilePage() {
  const messages = await getMessages();
  const profile = await getTrainerProfileForEdit();

  return <TrainerProfileEditForm profile={profile} />;
}
