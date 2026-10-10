import {
  FILE_UPLOAD_PURPOSE,
  USER_ROLE,
  type FileUploadPurpose,
  type PolicySessionContext,
} from "@pulse/domain";

import { PolicyError } from "../errors/policy-error";

export function assertCanReadFileAsset(
  ctx: PolicySessionContext | null,
  asset: { ownerUserId: string; purpose: FileUploadPurpose },
): asserts ctx is PolicySessionContext | null {
  if (asset.purpose === FILE_UPLOAD_PURPOSE.VERIFICATION_DOC) {
    if (!ctx) {
      throw new PolicyError("UNAUTHORIZED");
    }

    if (ctx.userId === asset.ownerUserId || ctx.role === USER_ROLE.ADMIN) {
      return;
    }

    throw new PolicyError("FORBIDDEN");
  }
}
