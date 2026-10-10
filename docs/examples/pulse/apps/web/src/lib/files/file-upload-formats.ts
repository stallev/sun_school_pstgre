import {
  getAllowedMimeTypes,
  getMaxUploadSizeBytes,
  type FileUploadPurpose,
} from "@pulse/domain";

const MIME_EXTENSION_LABELS: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WEBP",
  "application/pdf": "PDF",
};

export function getFileUploadExtensionLabels(
  purpose: FileUploadPurpose,
): string[] {
  const labels = getAllowedMimeTypes(purpose).map(
    (mime) => MIME_EXTENSION_LABELS[mime],
  );

  return [...new Set(labels.filter((label): label is string => Boolean(label)))];
}

export function getFileUploadMaxSizeMb(purpose: FileUploadPurpose): number {
  return Math.round(getMaxUploadSizeBytes(purpose) / (1024 * 1024));
}
