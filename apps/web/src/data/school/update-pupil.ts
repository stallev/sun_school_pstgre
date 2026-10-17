import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  updatePupilInputSchema,
  type MutationResult,
  type UpdatePupilInput,
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
  validateBirthDateInPast,
} from "./school-pupil-shared.server";

export async function updatePupilInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: UpdatePupilInput,
  todayIso: string,
): Promise<MutationResult> {
  const birthError = validateBirthDateInPast(input.birthDate, todayIso);
  if (birthError) return birthError;

  const pupil = await loadPupilInOrganization(tx, input.pupilId, organizationId);
  if (isMutationErr(pupil)) return pupil;

  await tx.pupil.update({
    where: { id: input.pupilId },
    data: {
      lastName: input.lastName,
      firstName: input.firstName,
      middleName: input.middleName ?? null,
      birthDate: calendarDateFromIso(input.birthDate),
      isActive: input.isActive,
    },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.PUPIL,
    entityId: input.pupilId,
    action: AUDIT_ACTION.SCHOOL_PUPIL_UPDATED,
    oldValue: { isActive: pupil.isActive },
    newValue: { isActive: input.isActive },
  });

  return { ok: true };
}

export async function updatePupil(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = updatePupilInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const todayIso = isoTodayUtc();

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return updatePupilInTransaction(tx, actorUserId, organizationId, parsed.data, todayIso);
  });
}
