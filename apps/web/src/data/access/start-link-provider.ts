import "server-only";
import {
  ACCOUNT_STATUS,
  LOGIN_PROVIDER,
  MUTATION_ERROR_CODES,
  type LoginProvider,
  type MutationResult,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { createLinkIntentCookie } from "@/lib/auth/link-intent";

const ALLOWED_STATUSES: ReadonlySet<string> = new Set([
  ACCOUNT_STATUS.ACTIVE,
  ACCOUNT_STATUS.REQUEST_PENDING,
  ACCOUNT_STATUS.REJECTED,
]);

/** Sets the link-intent cookie; the client then calls `signIn("telegram")` (auth_runtime_spec §7). */
export async function startLinkProvider(
  db: PrismaClient,
  userId: string,
  provider: LoginProvider,
  now: Date,
): Promise<MutationResult> {
  if (provider !== LOGIN_PROVIDER.TELEGRAM) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "auth.profile.link_forbidden",
    };
  }

  const user = await db.appUser.findUnique({
    where: { id: userId },
    select: { status: true },
  });
  if (!user || !ALLOWED_STATUSES.has(user.status)) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.ACCESS_STATUS_INVALID,
      message: "auth.errors.status_invalid",
    };
  }

  await createLinkIntentCookie({ uid: userId, provider, now });
  return { ok: true };
}
