import "server-only";

import { updateTag } from "next/cache";

import {
  TRAINER_MUTATION_ERROR_CODES,
  TRAINER_STATUS,
  updateTrainerProfileSchema,
  validateFileAssetReadyForLink,
  validateTrainerTimezone,
  type MutationResult,
  type UpdateTrainerProfileInput,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";
import {
  assertCanEditTrainerProfile,
  PolicyError,
} from "@pulse/policy-server";

import { CACHE_TAGS } from "@/lib/cache/tags";
import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

type UpdateTrainerProfileResult = MutationResult<{ profileId: string }>;

function mapPolicyError(error: PolicyError): UpdateTrainerProfileResult {
  if (error.code === "UNAUTHORIZED") {
    return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.UNAUTHORIZED };
  }

  return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.FORBIDDEN };
}

async function resolvePhotoUrl(
  photoFileAssetId: string | undefined,
  ownerUserId: string,
): Promise<string | null | UpdateTrainerProfileResult> {
  if (!photoFileAssetId) {
    return null;
  }

  const asset = await getPrisma().fileAsset.findFirst({
    where: { id: photoFileAssetId, ownerUserId },
    select: { uploadStatus: true, blobUrl: true },
  });

  const readyError = validateFileAssetReadyForLink(asset);
  if (readyError) {
    return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.VALIDATION };
  }

  return asset!.blobUrl;
}

function invalidateTrainerProfileCache(
  profileId: string,
  status: string,
): void {
  updateTag(CACHE_TAGS.trainer(profileId));

  if (status === TRAINER_STATUS.APPROVED) {
    updateTag(CACHE_TAGS.trainersCatalog);
  }
}

export async function updateTrainerProfile(
  input: UpdateTrainerProfileInput,
): Promise<UpdateTrainerProfileResult> {
  const ctx = await getPolicySessionContext();
  if (!ctx) {
    return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.UNAUTHORIZED };
  }

  try {
    assertCanEditTrainerProfile(ctx, { userId: ctx.userId });
  } catch (error) {
    if (error instanceof PolicyError) {
      return mapPolicyError(error);
    }

    throw error;
  }

  const parsed = updateTrainerProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.VALIDATION };
  }

  const timezoneError = validateTrainerTimezone(parsed.data.timezone);
  if (timezoneError) {
    return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.VALIDATION };
  }

  const profile = await getPrisma().trainerProfile.findUnique({
    where: { userId: ctx.userId },
    select: { id: true, status: true },
  });

  if (!profile) {
    return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.VALIDATION };
  }

  const photoUrl = await resolvePhotoUrl(parsed.data.photoFileAssetId, ctx.userId);
  if (photoUrl && typeof photoUrl === "object" && "ok" in photoUrl) {
    return photoUrl;
  }

  const prisma = getPrisma();

  for (const row of parsed.data.certificates) {
    if (row.fileAssetId) {
      const asset = await prisma.fileAsset.findFirst({
        where: { id: row.fileAssetId, ownerUserId: ctx.userId },
        select: { uploadStatus: true },
      });
      const readyError = validateFileAssetReadyForLink(asset);
      if (readyError) {
        return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.VALIDATION };
      }
    }
  }

  const bio = parsed.data.bio?.trim() ? parsed.data.bio.trim() : null;
  const specializationRecords = await prisma.specialization.findMany({
    where: { slug: { in: parsed.data.specializationSlugs } },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.trainerProfile.update({
      where: { id: profile.id },
      data: {
        timezone: parsed.data.timezone,
        bio,
        experienceYears: parsed.data.experienceYears ?? null,
        ...(photoUrl ? { photoUrl } : {}),
      },
    });

    await tx.trainerSpecialization.deleteMany({
      where: { trainerProfileId: profile.id },
    });

    if (specializationRecords.length > 0) {
      await tx.trainerSpecialization.createMany({
        data: specializationRecords.map((record) => ({
          trainerProfileId: profile.id,
          specializationId: record.id,
        })),
      });
    }

    await tx.verificationDocument.deleteMany({
      where: { trainerProfileId: profile.id },
    });
    await tx.trainerCertificate.deleteMany({
      where: { trainerProfileId: profile.id },
    });

    for (const [index, row] of parsed.data.certificates.entries()) {
      const certificate = await tx.trainerCertificate.create({
        data: {
          trainerProfileId: profile.id,
          title: row.title,
          fileAssetId: row.fileAssetId ?? null,
          sortOrder: index,
        },
        select: { id: true, fileAssetId: true },
      });

      if (certificate.fileAssetId) {
        await tx.verificationDocument.create({
          data: {
            trainerProfileId: profile.id,
            docType: "certificate",
            fileAssetId: certificate.fileAssetId,
          },
        });
      }
    }
  });

  invalidateTrainerProfileCache(profile.id, profile.status);

  return { ok: true, data: { profileId: profile.id } };
}
