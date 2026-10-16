import "server-only";
import {
  ACCOUNT_STATUS,
  CONSENT_TYPE,
  MUTATION_ERROR_CODES,
  registrationInputSchema,
  type MutationResult,
} from "@sunschool/domain";
import type { Prisma, PrismaClient } from "@sunschool/db";
import { readConsentTextVersion } from "./consent-text-version.server";
import { mutationFromZodError } from "./map-zod-fields";

type Tx = Prisma.TransactionClient;

const consentOnlySchema = registrationInputSchema.pick({ consentAccepted: true });

export async function recordPrivacyConsentInTransaction(
  tx: Tx,
  userId: string,
  consentAccepted: boolean,
  now: Date,
): Promise<MutationResult> {
  const parsed = consentOnlySchema.safeParse({ consentAccepted });
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const user = await tx.appUser.findUnique({ where: { id: userId }, select: { status: true } });
  if (!user) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  if (user.status !== ACCOUNT_STATUS.ACTIVE) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.ACCESS_STATUS_INVALID,
      message: "auth.errors.status_invalid",
    };
  }

  const consentVersion = await readConsentTextVersion(tx);
  const existing = await tx.privacyConsent.findFirst({
    where: { userId, type: CONSENT_TYPE.PD_PROCESSING, textVersion: consentVersion },
    select: { id: true },
  });
  if (existing) return { ok: true };

  await tx.privacyConsent.create({
    data: {
      userId,
      textVersion: consentVersion,
      acceptedAt: now,
      type: CONSENT_TYPE.PD_PROCESSING,
    },
  });

  return { ok: true };
}

export async function recordPrivacyConsent(
  db: PrismaClient,
  userId: string,
  consentAccepted: boolean,
  now: Date,
): Promise<MutationResult> {
  return db.$transaction((tx) => recordPrivacyConsentInTransaction(tx, userId, consentAccepted, now));
}
