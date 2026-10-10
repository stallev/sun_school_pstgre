import "server-only";

import { redirect } from "next/navigation";

import {
  submitTrainerApplicationSchema,
  TRAINER_MUTATION_ERROR_CODES,
  TRAINER_STATUS,
  validateSubmitTrainerApplication,
  type MutationResult,
  type SubmitTrainerApplicationInput,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";
import { assertCanMutateTrainerProfile, PolicyError } from "@pulse/policy-server";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

export type SubmitTrainerApplicationResult = MutationResult<{ profileId: string }>;

function mapPolicyError(error: PolicyError): SubmitTrainerApplicationResult {
  if (error.code === "UNAUTHORIZED") {
    return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.UNAUTHORIZED };
  }

  return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.FORBIDDEN };
}

export async function submitTrainerApplication(
  input: SubmitTrainerApplicationInput,
): Promise<SubmitTrainerApplicationResult> {
  const ctx = await getPolicySessionContext();
  const parsed = submitTrainerApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.VALIDATION };
  }

  const profile = await getPrisma().trainerProfile.findUnique({
    where: { userId: ctx?.userId ?? "" },
    select: {
      id: true,
      userId: true,
      status: true,
      submittedAt: true,
      certificates: {
        select: {
          fileAsset: { select: { uploadStatus: true } },
        },
      },
      verificationDocuments: {
        select: {
          fileAsset: { select: { uploadStatus: true } },
        },
      },
    },
  });

  if (!profile) {
    return { ok: false, code: TRAINER_MUTATION_ERROR_CODES.VALIDATION };
  }

  try {
    assertCanMutateTrainerProfile(ctx, {
      userId: profile.userId,
      status: profile.status,
    });
  } catch (error) {
    if (error instanceof PolicyError) {
      return mapPolicyError(error);
    }

    throw error;
  }

  if (profile.submittedAt) {
    return { ok: true, data: { profileId: profile.id } };
  }

  const validationError = validateSubmitTrainerApplication({
    status: profile.status,
    submittedAt: profile.submittedAt,
    certificates: profile.certificates.map((certificate) => ({
      uploadStatus: certificate.fileAsset?.uploadStatus ?? "pending",
    })),
    verificationDocuments: profile.verificationDocuments.map((document) => ({
      uploadStatus: document.fileAsset.uploadStatus,
    })),
  });

  if (validationError) {
    return { ok: false, code: validationError.code };
  }

  const updated = await getPrisma().trainerProfile.updateMany({
    where: {
      id: profile.id,
      status: { in: [TRAINER_STATUS.PENDING, TRAINER_STATUS.REJECTED] },
      submittedAt: null,
    },
    data: { submittedAt: new Date() },
  });

  if (updated.count === 0 && !profile.submittedAt) {
    return {
      ok: false,
      code: TRAINER_MUTATION_ERROR_CODES.INVALID_STATUS_TRANSITION,
    };
  }

  return { ok: true, data: { profileId: profile.id } };
}

export async function submitTrainerApplicationWithRedirect(
  input: SubmitTrainerApplicationInput,
): Promise<SubmitTrainerApplicationResult> {
  const result = await submitTrainerApplication(input);
  if (result.ok) {
    redirect("/trainer/dashboard?submitted=1");
  }

  return result;
}
