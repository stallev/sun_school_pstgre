import "server-only";

import { randomUUID } from "node:crypto";

import {
  buildFileUploadObjectKey,
  FILE_UPLOAD_MUTATION_ERROR_CODES,
  initiateUploadInputSchema,
  validateUploadRequest,
  type InitiateUploadInput,
  type MutationResult,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";
import { assertCanInitiateUpload, PolicyError } from "@pulse/policy-server";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

export type InitiateUploadResult = MutationResult<{
  fileAssetId: string;
  pathname: string;
}>;

function mapPolicyError(error: PolicyError): InitiateUploadResult {
  if (error.code === "UNAUTHORIZED") {
    return {
      ok: false,
      code: FILE_UPLOAD_MUTATION_ERROR_CODES.UNAUTHORIZED,
    };
  }

  return {
    ok: false,
    code: FILE_UPLOAD_MUTATION_ERROR_CODES.FORBIDDEN,
  };
}

export async function initiateUpload(
  input: InitiateUploadInput,
): Promise<InitiateUploadResult> {
  const ctx = await getPolicySessionContext();
  const parsed = initiateUploadInputSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, code: FILE_UPLOAD_MUTATION_ERROR_CODES.VALIDATION };
  }

  const { purpose, mimeType, sizeBytes } = parsed.data;

  try {
    assertCanInitiateUpload(ctx, purpose);
  } catch (error) {
    if (error instanceof PolicyError) {
      return mapPolicyError(error);
    }

    throw error;
  }

  const uploadValidation = validateUploadRequest(purpose, mimeType, sizeBytes);
  if (uploadValidation) {
    return { ok: false, code: uploadValidation.code };
  }

  const ownerUserId = ctx!.userId;
  const objectKey = buildFileUploadObjectKey(
    ownerUserId,
    purpose,
    randomUUID(),
  );

  const fileAsset = await getPrisma().fileAsset.create({
    data: {
      ownerUserId,
      blobPathname: objectKey,
      mimeType,
      sizeBytes,
      uploadStatus: "pending",
    },
    select: { id: true, blobPathname: true },
  });

  return {
    ok: true,
    data: {
      fileAssetId: fileAsset.id,
      pathname: fileAsset.blobPathname,
    },
  };
}
