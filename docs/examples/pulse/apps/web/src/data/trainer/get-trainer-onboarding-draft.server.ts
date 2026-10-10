import "server-only";

import {
  TRAINER_STATUS,
  type OnboardingServiceRow,
  type TrainerTimezone,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";

export type TrainerOnboardingDraft = {
  profileId: string | null;
  timezone: TrainerTimezone | "";
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
  services: OnboardingServiceRow[];
  submittedAt: Date | null;
  status: typeof TRAINER_STATUS.PENDING | typeof TRAINER_STATUS.REJECTED | typeof TRAINER_STATUS.APPROVED | null;
};

export async function getTrainerOnboardingDraft(
  userId: string,
): Promise<TrainerOnboardingDraft> {
  const profile = await getPrisma().trainerProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      timezone: true,
      photoUrl: true,
      bio: true,
      experienceYears: true,
      submittedAt: true,
      status: true,
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
      services: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          durationMinutes: true,
          priceCents: true,
          description: true,
        },
      },
    },
  });

  if (!profile) {
    return {
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
  }

  return {
    profileId: profile.id,
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
    services: profile.services.map((service) => ({
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
      description: service.description ?? undefined,
    })),
    submittedAt: profile.submittedAt,
    status: profile.status,
  };
}

export async function getTrainerProfilePolicyFacts(userId: string) {
  return getPrisma().trainerProfile.findUnique({
    where: { userId },
    select: { id: true, userId: true, status: true },
  });
}
