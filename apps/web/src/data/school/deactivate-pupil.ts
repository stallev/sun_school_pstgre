import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  deactivatePupilInputSchema,
  type DeactivatePupilInput,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";

type Tx = Prisma.TransactionClient;
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { calendarDateFromIso } from "./calendar-date";
import {
  isoTodayUtc,
  loadActorOrganizationId,
  loadPupilInOrganization,
  lockPupilRow,
} from "./school-pupil-shared.server";

export async function deactivatePupilInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: DeactivatePupilInput,
  todayIso: string,
): Promise<MutationResult> {
  const locked = await lockPupilRow(tx, input.pupilId);
  if (!locked) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const pupil = await loadPupilInOrganization(tx, input.pupilId, organizationId);
  if (isMutationErr(pupil)) return pupil;

  await tx.pupil.update({
    where: { id: input.pupilId },
    data: { isActive: false },
  });

  await tx.enrollment.updateMany({
    where: { pupilId: input.pupilId, endsOn: null },
    data: { endsOn: calendarDateFromIso(todayIso) },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.PUPIL,
    entityId: input.pupilId,
    action: AUDIT_ACTION.SCHOOL_PUPIL_DEACTIVATED,
    oldValue: { isActive: pupil.isActive },
    newValue: { isActive: false },
  });

  return { ok: true };
}

export async function deactivatePupil(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = deactivatePupilInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const todayIso = isoTodayUtc();

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return deactivatePupilInTransaction(tx, actorUserId, organizationId, parsed.data, todayIso);
  });
}
