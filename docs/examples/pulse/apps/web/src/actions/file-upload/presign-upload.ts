"use server";

import {
  FILE_UPLOAD_MUTATION_ERROR_CODES,
  presignUploadInputSchema,
  type MutationResult,
} from "@pulse/domain";

import { createPresignedPutUrl } from "@/data/file-asset/presign-upload.server";
import { getMessages } from "@/lib/messages/server";


export type PresignUploadActionResult = MutationResult<{ presignedUrl: string }>;

function mapUploadError(code: string, messages: Awaited<ReturnType<typeof getMessages>>): string {
  switch (code) {
    case FILE_UPLOAD_MUTATION_ERROR_CODES.INVALID_MIME:
      return messages.fileUpload.errors.invalidMime;
    case FILE_UPLOAD_MUTATION_ERROR_CODES.FILE_TOO_LARGE:
      return messages.fileUpload.errors.tooLarge;
    case FILE_UPLOAD_MUTATION_ERROR_CODES.UNAUTHORIZED:
      return messages.fileUpload.errors.unauthorized;
    case FILE_UPLOAD_MUTATION_ERROR_CODES.FORBIDDEN:
      return messages.fileUpload.errors.forbidden;
    case FILE_UPLOAD_MUTATION_ERROR_CODES.INVALID_UPLOAD_STATE:
      return messages.fileUpload.errors.generic;
    case FILE_UPLOAD_MUTATION_ERROR_CODES.UPLOAD_NOT_FOUND:
      return messages.fileUpload.errors.generic;
    default:
      return messages.fileUpload.errors.generic;
  }
}

export async function presignUploadAction(input: {
  fileAssetId: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<PresignUploadActionResult> {
  const messages = await getMessages();
  const parsed = presignUploadInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: FILE_UPLOAD_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.fileUpload.errors.validation,
    };
  }

  const result = await createPresignedPutUrl(parsed.data);
  if (!result.ok) {
    return {
      ...result,
      message: mapUploadError(result.code, messages),
    };
  }

  return result;
}
