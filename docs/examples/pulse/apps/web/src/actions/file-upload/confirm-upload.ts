"use server";

import {
  confirmUploadInputSchema,
  FILE_UPLOAD_MUTATION_ERROR_CODES,
  type MutationResult,
} from "@pulse/domain";

import { confirmUpload } from "@/data/file-asset/confirm-upload.server";
import { getMessages } from "@/lib/messages/server";


export type ConfirmUploadActionResult = MutationResult<{
  uploadStatus: "ready";
  readUrl: string;
}>;

function mapUploadError(code: string, messages: Awaited<ReturnType<typeof getMessages>>): string {
  switch (code) {
    case FILE_UPLOAD_MUTATION_ERROR_CODES.UNAUTHORIZED:
      return messages.fileUpload.errors.unauthorized;
    case FILE_UPLOAD_MUTATION_ERROR_CODES.FORBIDDEN:
      return messages.fileUpload.errors.forbidden;
    case FILE_UPLOAD_MUTATION_ERROR_CODES.UPLOAD_NOT_FOUND:
      return messages.fileUpload.errors.generic;
    case FILE_UPLOAD_MUTATION_ERROR_CODES.INVALID_UPLOAD_STATE:
      return messages.fileUpload.errors.generic;
    default:
      return messages.fileUpload.errors.generic;
  }
}

export async function confirmUploadAction(input: {
  fileAssetId: string;
  expectedSize: number;
}): Promise<ConfirmUploadActionResult> {
  const messages = await getMessages();
  const parsed = confirmUploadInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: FILE_UPLOAD_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.fileUpload.errors.validation,
    };
  }

  const result = await confirmUpload(parsed.data);
  if (!result.ok) {
    return {
      ...result,
      message: mapUploadError(result.code, messages),
    };
  }

  return result;
}
