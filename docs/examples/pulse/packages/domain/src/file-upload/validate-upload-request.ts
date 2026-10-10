import { FILE_UPLOAD_MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import {
  FILE_UPLOAD_PURPOSE,
  type FileUploadPurpose,
} from "../constants/file-upload-purpose";

const MIME_ALLOWLIST: Record<FileUploadPurpose, readonly string[]> = {
  [FILE_UPLOAD_PURPOSE.PROFILE_PHOTO]: [
    "image/jpeg",
    "image/png",
    "image/webp",
  ],
  [FILE_UPLOAD_PURPOSE.CERTIFICATE]: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ],
  [FILE_UPLOAD_PURPOSE.VERIFICATION_DOC]: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ],
};

const MAX_SIZE_BYTES: Record<FileUploadPurpose, number> = {
  [FILE_UPLOAD_PURPOSE.PROFILE_PHOTO]: 5 * 1024 * 1024,
  [FILE_UPLOAD_PURPOSE.CERTIFICATE]: 10 * 1024 * 1024,
  [FILE_UPLOAD_PURPOSE.VERIFICATION_DOC]: 10 * 1024 * 1024,
};

export type UploadRequestValidationError = {
  code: (typeof FILE_UPLOAD_MUTATION_ERROR_CODES)[keyof typeof FILE_UPLOAD_MUTATION_ERROR_CODES];
};

export function validateUploadRequest(
  purpose: FileUploadPurpose,
  mimeType: string,
  sizeBytes: number,
): UploadRequestValidationError | null {
  const allowedMimes = MIME_ALLOWLIST[purpose];
  if (!allowedMimes.includes(mimeType)) {
    return { code: FILE_UPLOAD_MUTATION_ERROR_CODES.INVALID_MIME };
  }

  if (sizeBytes > MAX_SIZE_BYTES[purpose]) {
    return { code: FILE_UPLOAD_MUTATION_ERROR_CODES.FILE_TOO_LARGE };
  }

  return null;
}

export function getMaxUploadSizeBytes(purpose: FileUploadPurpose): number {
  return MAX_SIZE_BYTES[purpose];
}

export function getAllowedMimeTypes(
  purpose: FileUploadPurpose,
): readonly string[] {
  return MIME_ALLOWLIST[purpose];
}

export type FileAssetUploadFacts = {
  uploadStatus: "pending" | "ready" | "failed";
};

export type FileAssetUploadValidationError = {
  code: typeof FILE_UPLOAD_MUTATION_ERROR_CODES.INVALID_UPLOAD_STATE;
};

export function validateFileAssetReadyForLink(
  asset: FileAssetUploadFacts | null | undefined,
): FileAssetUploadValidationError | null {
  if (!asset || asset.uploadStatus !== "ready") {
    return { code: FILE_UPLOAD_MUTATION_ERROR_CODES.INVALID_UPLOAD_STATE };
  }

  return null;
}
