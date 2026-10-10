/**
 * Root prefix for every Pulse S3 object key.
 * MUST end with `/`. Used in initiateUpload before presigned PUT.
 */
export const FILE_UPLOAD_OBJECT_KEY_PREFIX = "pulse/" as const;

/** File asset upload purposes per file_upload_contract. */
export const FILE_UPLOAD_PURPOSES = [
  "profile_photo",
  "certificate",
  "verification_doc",
] as const;

export type FileUploadPurpose = (typeof FILE_UPLOAD_PURPOSES)[number];

export const FILE_UPLOAD_PURPOSE = {
  PROFILE_PHOTO: "profile_photo",
  CERTIFICATE: "certificate",
  VERIFICATION_DOC: "verification_doc",
} as const;

export const FILE_UPLOAD_PURPOSE_SET = new Set<string>(FILE_UPLOAD_PURPOSES);

export function isFileUploadPurpose(value: string): value is FileUploadPurpose {
  return FILE_UPLOAD_PURPOSE_SET.has(value);
}
