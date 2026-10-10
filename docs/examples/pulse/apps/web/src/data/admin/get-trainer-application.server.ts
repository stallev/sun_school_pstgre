import "server-only";

import { notFound } from "next/navigation";

import { TRAINER_STATUS } from "@pulse/domain";
import { getPrisma } from "@pulse/db";

export type TrainerApplicationDocument = {
  id: string;
  title: string;
  fileAssetId: string | null;
  uploadStatus: string | null;
};

export type TrainerApplicationDetail = {
  id: string;
  fullName: string;
  email: string;
  photoUrl: string | null;
  bio: string | null;
  experienceYears: number | null;
  timezone: string;
  status: string;
  submittedAt: string | null;
  rejectionReason: string | null;
  specializationNames: string[];
  certificates: TrainerApplicationDocument[];
  verificationDocuments: TrainerApplicationDocument[];
  services: Array<{
    name: string;
    durationMinutes: number;
    priceCents: number;
  }>;
  canModerate: boolean;
};

export async function getTrainerApplication(
  trainerProfileId: string,
): Promise<TrainerApplicationDetail | null> {
  const profile = await getPrisma().trainerProfile.findFirst({
    where: { id: trainerProfileId },
    select: {
      id: true,
      photoUrl: true,
      bio: true,
      experienceYears: true,
      timezone: true,
      status: true,
      submittedAt: true,
      rejectionReason: true,
      user: { select: { fullName: true, email: true } },
      specializations: {
        select: { specialization: { select: { name: true } } },
      },
      certificates: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          fileAssetId: true,
          fileAsset: { select: { uploadStatus: true } },
        },
      },
      verificationDocuments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          docType: true,
          fileAssetId: true,
          fileAsset: { select: { uploadStatus: true } },
        },
      },
      services: {
        orderBy: { sortOrder: "asc" },
        select: {
          name: true,
          durationMinutes: true,
          priceCents: true,
        },
      },
    },
  });

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    fullName: profile.user.fullName,
    email: profile.user.email,
    photoUrl: profile.photoUrl,
    bio: profile.bio,
    experienceYears: profile.experienceYears,
    timezone: profile.timezone,
    status: profile.status,
    submittedAt: profile.submittedAt?.toISOString() ?? null,
    rejectionReason: profile.rejectionReason,
    specializationNames: profile.specializations.map(
      (entry) => entry.specialization.name,
    ),
    certificates: profile.certificates.map((certificate) => ({
      id: certificate.id,
      title: certificate.title,
      fileAssetId: certificate.fileAssetId,
      uploadStatus: certificate.fileAsset?.uploadStatus ?? null,
    })),
    verificationDocuments: profile.verificationDocuments.map((document) => ({
      id: document.id,
      title: document.docType,
      fileAssetId: document.fileAssetId,
      uploadStatus: document.fileAsset?.uploadStatus ?? null,
    })),
    services: profile.services,
    canModerate: profile.status === TRAINER_STATUS.PENDING,
  };
}

export async function requireTrainerApplication(
  trainerProfileId: string,
): Promise<TrainerApplicationDetail> {
  const application = await getTrainerApplication(trainerProfileId);

  if (!application) {
    notFound();
  }

  return application;
}
