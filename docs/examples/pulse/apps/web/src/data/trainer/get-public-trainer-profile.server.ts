import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";

import { TRAINER_STATUS } from "@pulse/domain";
import { getPrisma } from "@pulse/db";

import { CACHE_TAGS } from "@/lib/cache/tags";
import {
  mapPublicTrainerProfileRow,
  PUBLIC_TRAINER_PROFILE_SELECT,
  type PublicTrainerProfile,
} from "@/lib/trainer/trainer-profile";

async function loadPublicTrainerProfile(
  trainerProfileId: string,
): Promise<PublicTrainerProfile | null> {
  "use cache";
  cacheTag(CACHE_TAGS.trainer(trainerProfileId));
  cacheLife("minutes");

  const prisma = getPrisma();
  const row = await prisma.trainerProfile.findFirst({
    where: {
      id: trainerProfileId,
      status: TRAINER_STATUS.APPROVED,
    },
    select: PUBLIC_TRAINER_PROFILE_SELECT,
  });

  if (!row) {
    return null;
  }

  return mapPublicTrainerProfileRow(row);
}

export async function getPublicTrainerProfile(
  trainerProfileId: string,
): Promise<PublicTrainerProfile> {
  const profile = await loadPublicTrainerProfile(trainerProfileId);

  if (!profile) {
    notFound();
  }

  return profile;
}
