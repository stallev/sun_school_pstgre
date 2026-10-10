"use server";

import {
  FILE_UPLOAD_MUTATION_ERROR_CODES,
  initiateUploadInputSchema,
  type FileUploadPurpose,
  type MutationResult,
} from "@pulse/domain";

import { initiateUpload } from "@/data/file-asset/initiate-upload.server";
import { getMessages } from "@/lib/messages/server";


export type InitiateUploadActionResult = MutationResult<{
  fileAssetId: string;
  pathname: string;
}>;

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
    default:
      return messages.fileUpload.errors.generic;
  }
}

export async function initiateUploadAction(input: {
  purpose: FileUploadPurpose;
  mimeType: string;
  sizeBytes: number;
}): Promise<InitiateUploadActionResult> {
  const messages = await getMessages();
  const parsed = initiateUploadInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: FILE_UPLOAD_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.fileUpload.errors.validation,
    };
  }

  const result = await initiateUpload(parsed.data);
  if (!result.ok) {
    return {
      ...result,
      message: mapUploadError(result.code, messages),
    };
  }

  return result;
}
