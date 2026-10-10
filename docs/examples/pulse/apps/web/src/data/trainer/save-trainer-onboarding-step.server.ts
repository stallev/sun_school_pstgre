import "server-only";

import {
  saveOnboardingStep1Schema,
  saveOnboardingStep2Schema,
  saveOnboardingStep3Schema,
  saveOnboardingStep4Schema,
  TRAINER_MUTATION_ERROR_CODES,
  TRAINER_STATUS,
  type TrainerStatus,
  validateFileAssetReadyForLink,
  validateTrainerTimezone,
  type MutationResult,
  type SaveOnboardingStep1Input,
  type SaveOnboardingStep2Input,
  type SaveOnboardingStep3Input,
  type SaveOnboardingStep4Input,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";
import { assertCanMutateTrainerProfile, PolicyError } from "@pulse/policy-server";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";
import { getTrainerProfilePolicyFacts } from "./get-trainer-onboarding-draft.server";

type SaveStepResult = MutationResult<{ profileId: string }>;

function mapPolicyError(error: PolicyError): SaveStepResult {
  if (error.code === "UNAUTHORIZED") {
    return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.UNAUTHORIZED };
  }

  return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.FORBIDDEN };
}

async function assertTrainerCanMutate(userId: string): Promise<
  | { ok: true; profileId: string | null; status: TrainerStatus | null }
  | { ok: false; result: SaveStepResult }
> {
  const ctx = await getPolicySessionContext();
  const facts = await getTrainerProfilePolicyFacts(userId);

  try {
    if (facts) {
      assertCanMutateTrainerProfile(ctx, {
        userId: facts.userId,
        status: facts.status,
      });
    } else {
      assertCanMutateTrainerProfile(ctx);
    }
  } catch (error) {
    if (error instanceof PolicyError) {
      return { ok: false, result: mapPolicyError(error) };
    }

    throw error;
  }

  return {
    ok: true,
    profileId: facts?.id ?? null,
    status: facts?.status ?? null,
  };
}

async function resolvePhotoUrl(
  photoFileAssetId: string | undefined,
  ownerUserId: string,
): Promise<string | null | SaveStepResult> {
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

export async function saveOnboardingStep1(
  userId: string,
  input: SaveOnboardingStep1Input,
): Promise<SaveStepResult> {
  const gate = await assertTrainerCanMutate(userId);
  if (!gate.ok) {
    return gate.result;
  }

  const parsed = saveOnboardingStep1Schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.VALIDATION };
  }

  const timezoneError = validateTrainerTimezone(parsed.data.timezone);
  if (timezoneError) {
    return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.VALIDATION };
  }

  const photoUrl = await resolvePhotoUrl(parsed.data.photoFileAssetId, userId);
  if (photoUrl && typeof photoUrl === "object" && "ok" in photoUrl) {
    return photoUrl;
  }

  if (gate.profileId) {
    const profile = await getPrisma().trainerProfile.update({
      where: { id: gate.profileId },
      data: {
        timezone: parsed.data.timezone,
        ...(photoUrl ? { photoUrl } : {}),
      },
      select: { id: true },
    });

    return { ok: true, data: { profileId: profile.id } };
  }

  const profile = await getPrisma().trainerProfile.create({
    data: {
      userId,
      status: TRAINER_STATUS.PENDING,
      timezone: parsed.data.timezone,
      photoUrl: typeof photoUrl === "string" ? photoUrl : null,
    },
    select: { id: true },
  });

  return { ok: true, data: { profileId: profile.id } };
}

export async function saveOnboardingStep2(
  userId: string,
  input: SaveOnboardingStep2Input,
): Promise<SaveStepResult> {
  const gate = await assertTrainerCanMutate(userId);
  if (!gate.ok) {
    return gate.result;
  }

  if (!gate.profileId) {
    return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.VALIDATION };
  }

  const parsed = saveOnboardingStep2Schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.VALIDATION };
  }

  const bio = parsed.data.bio?.trim() ? parsed.data.bio.trim() : null;
  const specializationRecords = await getPrisma().specialization.findMany({
    where: { slug: { in: parsed.data.specializationSlugs } },
    select: { id: true },
  });

  await getPrisma().$transaction(async (tx) => {
    await tx.trainerProfile.update({
      where: { id: gate.profileId! },
      data: {
        bio,
        experienceYears: parsed.data.experienceYears ?? null,
      },
    });

    await tx.trainerSpecialization.deleteMany({
      where: { trainerProfileId: gate.profileId! },
    });

    if (specializationRecords.length > 0) {
      await tx.trainerSpecialization.createMany({
        data: specializationRecords.map((record) => ({
          trainerProfileId: gate.profileId!,
          specializationId: record.id,
        })),
      });
    }
  });

  return { ok: true, data: { profileId: gate.profileId } };
}

export async function saveOnboardingStep3(
  userId: string,
  input: SaveOnboardingStep3Input,
): Promise<SaveStepResult> {
  const gate = await assertTrainerCanMutate(userId);
  if (!gate.ok) {
    return gate.result;
  }

  if (!gate.profileId) {
    return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.VALIDATION };
  }

  const parsed = saveOnboardingStep3Schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.VALIDATION };
  }

  const prisma = getPrisma();

  for (const row of parsed.data.certificates) {
    if (row.fileAssetId) {
      const asset = await prisma.fileAsset.findFirst({
        where: { id: row.fileAssetId, ownerUserId: userId },
        select: { uploadStatus: true },
      });
      const readyError = validateFileAssetReadyForLink(asset);
      if (readyError) {
        return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.VALIDATION };
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.verificationDocument.deleteMany({
      where: { trainerProfileId: gate.profileId! },
    });
    await tx.trainerCertificate.deleteMany({
      where: { trainerProfileId: gate.profileId! },
    });

    for (const [index, row] of parsed.data.certificates.entries()) {
      const certificate = await tx.trainerCertificate.create({
        data: {
          trainerProfileId: gate.profileId!,
          title: row.title,
          fileAssetId: row.fileAssetId ?? null,
          sortOrder: index,
        },
        select: { id: true, fileAssetId: true },
      });

      if (certificate.fileAssetId) {
        await tx.verificationDocument.create({
          data: {
            trainerProfileId: gate.profileId!,
            docType: "certificate",
            fileAssetId: certificate.fileAssetId,
          },
        });
      }
    }
  });

  return { ok: true, data: { profileId: gate.profileId } };
}

export async function saveOnboardingStep4(
  userId: string,
  input: SaveOnboardingStep4Input,
): Promise<SaveStepResult> {
  const gate = await assertTrainerCanMutate(userId);
  if (!gate.ok) {
    return gate.result;
  }

  if (!gate.profileId) {
    return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.VALIDATION };
  }

  const parsed = saveOnboardingStep4Schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.VALIDATION };
  }

  await getPrisma().$transaction(async (tx) => {
    await tx.trainerService.deleteMany({
      where: { trainerProfileId: gate.profileId! },
    });

    if (parsed.data.services.length > 0) {
      await tx.trainerService.createMany({
        data: parsed.data.services.map((service, index) => ({
          trainerProfileId: gate.profileId!,
          name: service.name,
          description: service.description ?? null,
          durationMinutes: service.durationMinutes,
          priceCents: service.priceCents,
          sortOrder: index,
        })),
      });
    }
  });

  return { ok: true, data: { profileId: gate.profileId } };
}
