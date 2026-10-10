import {
  FILE_UPLOAD_PURPOSE_SET,
  USER_ROLE,
  type FileUploadPurpose,
  type PolicySessionContext,
} from "@pulse/domain";

import { PolicyError } from "../errors/policy-error";

export function assertCanInitiateUpload(
  ctx: PolicySessionContext | null,
  purpose: FileUploadPurpose,
  ownerUserId?: string,
): asserts ctx is PolicySessionContext {
  if (!ctx) {
    throw new PolicyError("UNAUTHORIZED");
  }

  if (!FILE_UPLOAD_PURPOSE_SET.has(purpose)) {
    throw new PolicyError("FORBIDDEN");
  }

  if (ctx.role === USER_ROLE.ADMIN) {
    return;
  }

  if (ctx.role !== USER_ROLE.TRAINER) {
    throw new PolicyError("FORBIDDEN");
  }

  if (ownerUserId && ownerUserId !== ctx.userId) {
    throw new PolicyError("FORBIDDEN");
  }
}
