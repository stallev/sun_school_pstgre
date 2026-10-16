import "server-only";
import {
  ACCESS_REQUEST_STATUS,
  ACCOUNT_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  canTransitionAccount,
  CONSENT_TYPE,
  MUTATION_ERROR_CODES,
  registrationInputSchema,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { readConsentTextVersion } from "./consent-text-version.server";
import { mutationFromZodError } from "./map-zod-fields";

type Tx = Prisma.TransactionClient;

export async function submitRegistrationInTransaction(
  tx: Tx,
  userId: string,
  input: ReturnType<typeof registrationInputSchema.parse>,
  now: Date,
): Promise<MutationResult> {
  const user = await tx.appUser.findUnique({
    where: { id: userId },
    select: { status: true },
  });
  if (!user) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  if (user.status === ACCOUNT_STATUS.REQUEST_PENDING) {
    const pending = await tx.accessRequest.findFirst({
      where: { userId, status: ACCESS_REQUEST_STATUS.PENDING },
      select: { id: true },
    });
    if (pending) {
      return { ok: true };
    }
  }

  if (user.status !== ACCOUNT_STATUS.REGISTRATION) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.ACCESS_STATUS_INVALID,
      message: "auth.errors.status_invalid",
    };
  }

  if (!canTransitionAccount(ACCOUNT_STATUS.REGISTRATION, ACCOUNT_STATUS.REQUEST_PENDING)) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.ACCESS_STATUS_INVALID,
      message: "auth.errors.status_invalid",
    };
  }

  const consentVersion = await readConsentTextVersion(tx);
  const snapshot = formatDisplayName(input);

  await tx.appUser.update({
    where: { id: userId },
    data: {
      lastName: input.lastName,
      firstName: input.firstName,
      middleName: input.middleName ?? null,
      status: ACCOUNT_STATUS.REQUEST_PENDING,
    },
  });

  const consent = await tx.privacyConsent.create({
    data: {
      userId,
      textVersion: consentVersion,
      acceptedAt: now,
      type: CONSENT_TYPE.PD_PROCESSING,
    },
  });

  const request = await tx.accessRequest.create({
    data: {
      userId,
      consentId: consent.id,
      fullNameSnapshot: snapshot,
      status: ACCESS_REQUEST_STATUS.PENDING,
    },
  });

  await writeAudit(tx, {
    actorUserId: userId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.ACCESS_REQUEST,
    entityId: request.id,
    action: AUDIT_ACTION.ACCESS_REGISTRATION_SUBMITTED,
  });

  return { ok: true };
}

/** `REGISTRATION → REQUEST_PENDING` (access_requests §5.2). */
export async function submitRegistration(
  db: PrismaClient,
  userId: string,
  raw: unknown,
  now: Date,
): Promise<MutationResult> {
  const parsed = registrationInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction((tx) => submitRegistrationInTransaction(tx, userId, parsed.data, now));
}
