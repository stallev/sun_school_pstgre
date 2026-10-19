import "server-only";
import {
  CONSENT_STATUS,
  MUTATION_ERROR_CODES,
  recordPaperConsentInputSchema,
  type MutationResult,
  type RecordPaperConsentInput,
} from "@sunschool/domain";
import type { Prisma, PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { recordPaperConsentInTransaction } from "./record-paper-consent";
import { assertAdminActor } from "./school-enrollment-shared.server";
import {
  isoTodayUtc,
  loadActorOrganizationId,
  loadPupilInOrganization,
} from "./school-pupil-shared.server";
import { isMutationErr } from "../access/access-admin-guards.server";

type Tx = Prisma.TransactionClient;

/** Record paper consent for a pupil in `LEGACY_PENDING` (ADR-011 §4.7). */
export async function resolveLegacyConsentInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: RecordPaperConsentInput,
  todayIso: string,
): Promise<MutationResult<{ consentId: string }>> {
  const adminError = await assertAdminActor(tx, actorUserId);
  if (adminError) return adminError;

  const pupil = await loadPupilInOrganization(tx, input.pupilId, organizationId);
  if (isMutationErr(pupil)) return pupil;

  const legacyPending = await tx.childDataConsent.findFirst({
    where: { pupilId: input.pupilId, status: CONSENT_STATUS.LEGACY_PENDING },
    select: { id: true },
  });
  if (!legacyPending) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "admin.people.consent_not_legacy_pending",
    };
  }

  return recordPaperConsentInTransaction(tx, actorUserId, organizationId, input, todayIso);
}

export async function resolveLegacyConsent(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ consentId: string }>> {
  const parsed = recordPaperConsentInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const todayIso = isoTodayUtc();

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return resolveLegacyConsentInTransaction(tx, actorUserId, organizationId, parsed.data, todayIso);
  });
}
