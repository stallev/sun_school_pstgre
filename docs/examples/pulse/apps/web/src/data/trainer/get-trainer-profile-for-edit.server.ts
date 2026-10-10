import "server-only";

import { redirect } from "next/navigation";

import {
  TRAINER_STATUS,
  type TrainerTimezone,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

export type TrainerProfileForEdit = {
  profileId: string;
  status: typeof TRAINER_STATUS.PENDING | typeof TRAINER_STATUS.REJECTED | typeof TRAINER_STATUS.APPROVED;
  timezone: TrainerTimezone;
  photoUrl: string | null;
  bio: string;
  experienceYears: number | null;
  specializationSlugs: string[];
  certificates: Array<{
    id: string;
    title: string;
    fileAssetId: string | null;
    blobUrl: string | null;
  }>;
};

export async function getTrainerProfileForEdit(): Promise<TrainerProfileForEdit> {
  const ctx = await getPolicySessionContext();
  if (!ctx) {
    redirect("/auth/login");
  }

  const profile = await getPrisma().trainerProfile.findUnique({
    where: { userId: ctx.userId },
    select: {
      id: true,
      status: true,
      timezone: true,
      photoUrl: true,
      bio: true,
      experienceYears: true,
      specializations: {
        select: { specialization: { select: { slug: true } } },
      },
      certificates: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          fileAssetId: true,
          fileAsset: { select: { blobUrl: true, uploadStatus: true } },
        },
      },
    },
  });

  if (!profile) {
    redirect("/auth/register/trainer");
  }

  return {
    profileId: profile.id,
    status: profile.status,
    timezone: profile.timezone as TrainerTimezone,
    photoUrl: profile.photoUrl,
    bio: profile.bio ?? "",
    experienceYears: profile.experienceYears,
    specializationSlugs: profile.specializations.map(
      (entry) => entry.specialization.slug,
    ),
    certificates: profile.certificates.map((certificate) => ({
      id: certificate.id,
      title: certificate.title,
      fileAssetId: certificate.fileAssetId,
      blobUrl:
        certificate.fileAsset?.uploadStatus === "ready"
          ? certificate.fileAsset.blobUrl
          : null,
    })),
  };
}
