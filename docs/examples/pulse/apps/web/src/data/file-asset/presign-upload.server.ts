import "server-only";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  FILE_UPLOAD_MUTATION_ERROR_CODES,
  isFileUploadObjectKey,
  parseFileUploadPurposeFromObjectKey,
  presignUploadInputSchema,
  validateUploadRequest,
  type MutationResult,
  type PresignUploadInput,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";
import { assertCanInitiateUpload, PolicyError } from "@pulse/policy-server";

import { getS3Client } from "@/lib/s3/s3-client";
import { getS3BucketName, S3_UPLOAD_URL_TTL_SECONDS } from "@/lib/s3/s3-config";
import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

export type PresignUploadResult = MutationResult<{ presignedUrl: string }>;

function mapPolicyError(error: PolicyError): PresignUploadResult {
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

export async function createPresignedPutUrl(
  input: PresignUploadInput,
): Promise<PresignUploadResult> {
  const parsed = presignUploadInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: FILE_UPLOAD_MUTATION_ERROR_CODES.VALIDATION };
  }

  const ctx = await getPolicySessionContext();
  const { fileAssetId, mimeType, sizeBytes } = parsed.data;

  const asset = await getPrisma().fileAsset.findUnique({
    where: { id: fileAssetId },
    select: {
      id: true,
      ownerUserId: true,
      blobPathname: true,
      uploadStatus: true,
      mimeType: true,
      sizeBytes: true,
    },
  });

  if (!asset) {
    return { ok: false, code: FILE_UPLOAD_MUTATION_ERROR_CODES.UPLOAD_NOT_FOUND };
  }

  if (asset.uploadStatus !== "pending") {
    return { ok: false, code: FILE_UPLOAD_MUTATION_ERROR_CODES.INVALID_UPLOAD_STATE };
  }

  if (!isFileUploadObjectKey(asset.blobPathname)) {
    return { ok: false, code: FILE_UPLOAD_MUTATION_ERROR_CODES.FORBIDDEN };
  }

  const purpose = parseFileUploadPurposeFromObjectKey(asset.blobPathname);
  if (!purpose) {
    return { ok: false, code: FILE_UPLOAD_MUTATION_ERROR_CODES.FORBIDDEN };
  }

  try {
    assertCanInitiateUpload(ctx, purpose, asset.ownerUserId);
  } catch (error) {
    if (error instanceof PolicyError) {
      return mapPolicyError(error);
    }

    throw error;
  }

  if (asset.mimeType !== mimeType || asset.sizeBytes !== sizeBytes) {
    return { ok: false, code: FILE_UPLOAD_MUTATION_ERROR_CODES.VALIDATION };
  }

  const uploadValidation = validateUploadRequest(purpose, mimeType, sizeBytes);
  if (uploadValidation) {
    return { ok: false, code: uploadValidation.code };
  }

  const command = new PutObjectCommand({
    Bucket: getS3BucketName(),
    Key: asset.blobPathname,
    ContentType: mimeType,
    ContentLength: sizeBytes,
  });

  const presignedUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: S3_UPLOAD_URL_TTL_SECONDS,
  });

  return {
    ok: true,
    data: { presignedUrl },
  };
}
