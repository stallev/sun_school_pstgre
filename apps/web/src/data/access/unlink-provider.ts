import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  LOGIN_PROVIDER,
  MUTATION_ERROR_CODES,
  type LoginProvider,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";

type Tx = Prisma.TransactionClient;

const lockUserIdentities = async (tx: Tx, userId: string): Promise<void> => {
  await tx.$queryRaw`
    SELECT id FROM login_identity WHERE user_id = ${userId}::uuid FOR UPDATE
  `;
};

/** User-initiated unlink (auth_runtime_spec §7). Only Telegram; not the last method. */
export async function unlinkProvider(
  db: PrismaClient,
  userId: string,
  provider: LoginProvider,
): Promise<MutationResult> {
  if (provider !== LOGIN_PROVIDER.TELEGRAM) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "auth.profile.unlink_forbidden",
    };
  }

  return db.$transaction(async (tx) => {
    await lockUserIdentities(tx, userId);
    const identities = await tx.loginIdentity.findMany({
      where: { userId },
      select: { id: true, provider: true },
    });

    if (identities.length <= 1) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.AUTH_LAST_IDENTITY,
        message: "auth.profile.last_identity",
      };
    }

    const target = identities.find((row) => row.provider === provider);
    if (!target) {
      return { ok: true };
    }

    await tx.loginIdentity.delete({ where: { id: target.id } });

    await writeAudit(tx, {
      actorUserId: userId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.LOGIN_IDENTITY,
      entityId: userId,
      action: AUDIT_ACTION.AUTH_IDENTITY_UNLINKED,
      oldValue: { provider },
    });

    return { ok: true };
  });
}
