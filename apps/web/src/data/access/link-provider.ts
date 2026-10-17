import "server-only";
import {
  ACCOUNT_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  LOGIN_PROVIDER,
  MUTATION_ERROR_CODES,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";

type Tx = Prisma.TransactionClient;

const LINKABLE_STATUSES: ReadonlySet<string> = new Set([
  ACCOUNT_STATUS.ACTIVE,
  ACCOUNT_STATUS.REQUEST_PENDING,
  ACCOUNT_STATUS.REJECTED,
]);

export type LinkTelegramInput = {
  userId: string;
  providerAccountId: string;
  now: Date;
};

/** Attach a free Telegram identity to `userId` (auth_runtime_spec §5.1 step 6, §7). */
export async function linkTelegram(tx: Tx, input: LinkTelegramInput): Promise<MutationResult> {
  const user = await tx.appUser.findUnique({
    where: { id: input.userId },
    select: { id: true, status: true },
  });
  if (!user || !LINKABLE_STATUSES.has(user.status)) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const existing = await tx.loginIdentity.findUnique({
    where: {
      provider_providerAccountId: {
        provider: LOGIN_PROVIDER.TELEGRAM,
        providerAccountId: input.providerAccountId,
      },
    },
    select: { id: true, userId: true },
  });

  if (existing) {
    if (existing.userId === input.userId) {
      return { ok: true };
    }
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.AUTH_LINK_CONFLICT,
      message: "auth.profile.link_conflict",
    };
  }

  await tx.loginIdentity.create({
    data: {
      userId: input.userId,
      provider: LOGIN_PROVIDER.TELEGRAM,
      providerAccountId: input.providerAccountId,
    },
  });

  await writeAudit(tx, {
    actorUserId: input.userId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.LOGIN_IDENTITY,
    entityId: input.userId,
    action: AUDIT_ACTION.AUTH_IDENTITY_LINKED,
    newValue: { provider: LOGIN_PROVIDER.TELEGRAM },
  });

  return { ok: true };
}

export async function linkTelegramInTransaction(
  prisma: PrismaClient,
  input: LinkTelegramInput,
): Promise<MutationResult> {
  return prisma.$transaction((tx) => linkTelegram(tx, input));
}
