import { FILE_UPLOAD_PURPOSE } from "@pulse/domain";

import type { Messages } from "@/lib/messages/types";

import {
  getFileUploadExtensionLabels,
  getFileUploadMaxSizeMb,
} from "@/lib/files/file-upload-formats";

export function getCertificateUploadFormatsHint(messages: Messages): string {
  const extensions = getFileUploadExtensionLabels(FILE_UPLOAD_PURPOSE.CERTIFICATE);
  const maxMb = getFileUploadMaxSizeMb(FILE_UPLOAD_PURPOSE.CERTIFICATE);

  return messages.trainer.onboarding.certificateUploadHint
    .replace("{formats}", extensions.join(", "))
    .replace("{maxMb}", String(maxMb));
}
