import {
  FILE_UPLOAD_OBJECT_KEY_PREFIX,
  isFileUploadPurpose,
  type FileUploadPurpose,
} from "./file-upload-purpose";

/** Re-export for consumers that import from this module only. */
export { FILE_UPLOAD_OBJECT_KEY_PREFIX } from "./file-upload-purpose";

/**
 * Canonical S3 object key for a Pulse file asset.
 * Pattern: `{prefix}{ownerUserId}/{purpose}/{fileId}`
 */
export function buildFileUploadObjectKey(
  ownerUserId: string,
  purpose: FileUploadPurpose,
  fileId: string,
): string {
  return `${FILE_UPLOAD_OBJECT_KEY_PREFIX}${ownerUserId}/${purpose}/${fileId}`;
}

/** Guard against path traversal and keys from other apps sharing the bucket. */
export function isFileUploadObjectKey(objectKey: string): boolean {
  return objectKey.startsWith(FILE_UPLOAD_OBJECT_KEY_PREFIX);
}

/** Parses `{prefix}{ownerUserId}/{purpose}/{fileId}` — returns null when invalid. */
export function parseFileUploadPurposeFromObjectKey(
  objectKey: string,
): FileUploadPurpose | null {
  if (!isFileUploadObjectKey(objectKey)) {
    return null;
  }

  const segments = objectKey
    .slice(FILE_UPLOAD_OBJECT_KEY_PREFIX.length)
    .split("/");

  if (segments.length < 3) {
    return null;
  }

  const purpose = segments[1];
  return isFileUploadPurpose(purpose) ? purpose : null;
}
