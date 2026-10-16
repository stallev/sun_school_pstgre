import "server-only";
import {
  ACCOUNT_STATUS,
  isRegistrationExpired,
  LOGIN_PROVIDER,
  type AccountStatus,
} from "@sunschool/domain";
import { Prisma, type PrismaClient } from "@sunschool/db";
import { purgeRegistration } from "./purge-expired-registration";

/**
 * Telegram sign-in against the database (auth_runtime_spec §5.1 steps 3, 4, 7, 8, 9;
 * access_requests §5.1 `firstLogin`). Never takes status or roles from the client.
 * - known identity: `DISABLED` / `DELETED` are refused; `username` / `phone` are refreshed (an empty
 *   value does not erase a stored one); `last_login_at` (and an empty `first_login_at`) are set;
 * - an expired `REGISTRATION` of the same person is purged and created again;
 * - unknown identity: `app_user` (`REGISTRATION`) + `login_identity` in one transaction.
 * A double first login races on `UNIQUE (provider, provider_account_id)`; the loser re-reads.
 */
type Tx = Prisma.TransactionClient;

export type TelegramSignInInput = {
  providerAccountId: string;
  username: string | null;
  phone: string | null;
  now: Date;
};

export type TelegramSignInResult =
  | { kind: "ok"; userId: string; status: AccountStatus; created: boolean }
  | { kind: "denied" };

const TELEGRAM = LOGIN_PROVIDER.TELEGRAM;

export async function signInTelegram(tx: Tx, input: TelegramSignInInput): Promise<TelegramSignInResult> {
  const identity = await tx.loginIdentity.findUnique({
    where: { provider_providerAccountId: { provider: TELEGRAM, providerAccountId: input.providerAccountId } },
    include: { user: true },
  });

  if (identity) {
    const user = identity.user;
    if (user.status === ACCOUNT_STATUS.DISABLED || user.status === ACCOUNT_STATUS.DELETED) {
      return { kind: "denied" };
    }
    if (!isRegistrationExpired(user, input.now)) {
      const nextUsername = input.username ?? identity.username;
      const nextPhone = input.phone ?? identity.phone;
      if (nextUsername !== identity.username || nextPhone !== identity.phone) {
        await tx.loginIdentity.update({
          where: { id: identity.id },
          data: { username: nextUsername, phone: nextPhone },
        });
      }
      await tx.appUser.update({
        where: { id: user.id },
        data: { lastLoginAt: input.now, firstLoginAt: user.firstLoginAt ?? input.now },
      });
      return { kind: "ok", userId: user.id, status: user.status, created: false };
    }
    await purgeRegistration(tx, user.id); // expired: start over below
  }

  const organization = await tx.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (!organization) throw new Error("No organization: run db:seed:reference first");

  const user = await tx.appUser.create({
    data: {
      organizationId: organization.id,
      status: ACCOUNT_STATUS.REGISTRATION,
      firstLoginAt: input.now,
      lastLoginAt: input.now,
      identities: {
        create: {
          provider: TELEGRAM,
          providerAccountId: input.providerAccountId,
          username: input.username,
          phone: input.phone,
        },
      },
    },
  });
  return { kind: "ok", userId: user.id, status: ACCOUNT_STATUS.REGISTRATION, created: true };
}

/** P2002: unique key taken by the winner of a double first login; P2025: the winner already purged the expired row. */
const isRaceLoss = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2025");

/** One transaction; if two logins of the same person collide (unique key / already purged), the loser runs once more and re-reads. */
export async function signInTelegramInTransaction(
  prisma: PrismaClient,
  input: TelegramSignInInput,
): Promise<TelegramSignInResult> {
  try {
    return await prisma.$transaction((tx) => signInTelegram(tx, input));
  } catch (error) {
    if (!isRaceLoss(error)) throw error;
    return prisma.$transaction((tx) => signInTelegram(tx, input));
  }
}
