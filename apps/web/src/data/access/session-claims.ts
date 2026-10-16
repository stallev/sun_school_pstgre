import "server-only";
import { LOGIN_PROVIDER, type AccountStatus, type LoginProvider, type UserRole } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";

/**
 * The only claims that enter the JWT (ADR-003 §4.3): `uid` (= `app_user.id`, resolved through
 * `login_identity`, NOT the provider's id), `status`, `roles`. Read once at sign-in; afterwards the
 * token is an optimistic slice and every server check re-reads the database (AZ-D5).
 */
export type SessionClaims = { uid: string; status: AccountStatus; roles: UserRole[] };

type Db = Pick<PrismaClient, "loginIdentity" | "appUser">;

const select = { id: true, status: true, roles: { select: { role: true } } } as const;

export async function resolveSessionClaims(
  db: Db,
  input: { provider: LoginProvider; providerAccountId: string },
): Promise<SessionClaims | null> {
  // For CREDENTIALS, Auth.js passes the `authorize()` result id (= uid) as the account id.
  const user =
    input.provider === LOGIN_PROVIDER.CREDENTIALS
      ? await db.appUser.findUnique({ where: { id: input.providerAccountId }, select })
      : (
          await db.loginIdentity.findUnique({
            where: {
              provider_providerAccountId: { provider: input.provider, providerAccountId: input.providerAccountId },
            },
            select: { user: { select } },
          })
        )?.user;
  if (!user) return null;
  return { uid: user.id, status: user.status, roles: user.roles.map((entry) => entry.role) };
}
