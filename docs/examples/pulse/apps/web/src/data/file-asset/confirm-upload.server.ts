import "server-only";

import { HeadObjectCommand } from "@aws-sdk/client-s3";

import {
  confirmUploadInputSchema,
  FILE_UPLOAD_MUTATION_ERROR_CODES,
  isFileUploadObjectKey,
  type ConfirmUploadInput,
  type MutationResult,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";

import { buildFileAssetServeUrl } from "@/lib/files/file-asset-serve-url";
import { getS3Client } from "@/lib/s3/s3-client";
import { getS3BucketName } from "@/lib/s3/s3-config";
import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

export type ConfirmUploadResult = MutationResult<{
  uploadStatus: "ready";
  readUrl: string;
}>;

async function markUploadFailed(fileAssetId: string): Promise<void> {
  await getPrisma().fileAsset.update({
    where: { id: fileAssetId },
    data: { uploadStatus: "failed" },
  });
}

async function markUploadReady(
  fileAssetId: string,
  actualSize: number,
): Promise<ConfirmUploadResult> {
  const existing = await getPrisma().fileAsset.findFirst({
    where: { id: fileAssetId },
    select: { id: true, uploadStatus: true },
  });

  if (!existing) {
    return { ok: false, code: FILE_UPLOAD_MUTATION_ERROR_CODES.UPLOAD_NOT_FOUND };
  }

  const readUrl = buildFileAssetServeUrl(fileAssetId);

  if (existing.uploadStatus === "ready") {
    return { ok: true, data: { uploadStatus: "ready", readUrl } };
  }

  await getPrisma().fileAsset.update({
    where: { id: fileAssetId },
    data: {
      uploadStatus: "ready",
      sizeBytes: actualSize,
      blobUrl: readUrl,
    },
  });

  return { ok: true, data: { uploadStatus: "ready", readUrl } };
}

export async function confirmUpload(
  input: ConfirmUploadInput,
): Promise<ConfirmUploadResult> {
  const parsed = confirmUploadInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: FILE_UPLOAD_MUTATION_ERROR_CODES.VALIDATION };
  }

  const { fileAssetId, expectedSize } = parsed.data;

  const existing = await getPrisma().fileAsset.findFirst({
    where: { id: fileAssetId },
    select: {
      id: true,
      ownerUserId: true,
      blobPathname: true,
      uploadStatus: true,
    },
  });

  if (!existing) {
    return { ok: false, code: FILE_UPLOAD_MUTATION_ERROR_CODES.UPLOAD_NOT_FOUND };
  }

  const ctx = await getPolicySessionContext();
  if (!ctx || ctx.userId !== existing.ownerUserId) {
    return { ok: false, code: FILE_UPLOAD_MUTATION_ERROR_CODES.FORBIDDEN };
  }

  if (existing.uploadStatus === "ready") {
    return markUploadReady(fileAssetId, expectedSize);
  }

  if (existing.uploadStatus !== "pending") {
    return { ok: false, code: FILE_UPLOAD_MUTATION_ERROR_CODES.INVALID_UPLOAD_STATE };
  }

  if (!isFileUploadObjectKey(existing.blobPathname)) {
    return { ok: false, code: FILE_UPLOAD_MUTATION_ERROR_CODES.FORBIDDEN };
  }

  let actualSize: number;

  try {
    const head = await getS3Client().send(
      new HeadObjectCommand({
        Bucket: getS3BucketName(),
        Key: existing.blobPathname,
      }),
    );
    actualSize = head.ContentLength ?? 0;
  } catch {
    await markUploadFailed(fileAssetId);
    return { ok: false, code: FILE_UPLOAD_MUTATION_ERROR_CODES.UPLOAD_NOT_FOUND };
  }

  if (actualSize !== expectedSize) {
    await markUploadFailed(fileAssetId);
    return { ok: false, code: FILE_UPLOAD_MUTATION_ERROR_CODES.VALIDATION };
  }

  return markUploadReady(fileAssetId, actualSize);
}
