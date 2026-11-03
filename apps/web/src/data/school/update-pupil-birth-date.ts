import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  updatePupilBirthDateInputSchema,
  type MutationErr,
  type MutationResult,
  type UpdatePupilBirthDateInput,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { assertPupilBirthDateAccess } from "./pupil-birth-date-access.server";
import { calendarDateFromIso, isoFromCalendarDate } from "./calendar-date";
import { isoTodayUtc, loadActorOrganizationId } from "./school-pupil-shared.server";

type Tx = Prisma.TransactionClient;

const validateBirthDateForUpdate = (birthDate: string, todayIso: string): MutationErr | null => {
  if (birthDate >= todayIso) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "common.errors.birth_date_in_future",
      fields: { birthDate: "common.errors.birth_date_in_future" },
    };
  }
  return null;
};

export async function updatePupilBirthDateInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: UpdatePupilBirthDateInput,
  todayIso: string,
): Promise<MutationResult> {
  const accessError = await assertPupilBirthDateAccess(tx, actorUserId, organizationId, input.pupilId);
  if (accessError) return accessError;

  const birthError = validateBirthDateForUpdate(input.birthDate, todayIso);
  if (birthError) return birthError;

  const pupil = await tx.pupil.findFirst({
    where: { id: input.pupilId, organizationId },
    select: { id: true, birthDate: true },
  });
  if (!pupil) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const currentIso = pupil.birthDate ? isoFromCalendarDate(pupil.birthDate) : null;
  if (currentIso === input.birthDate) return { ok: true };

  await tx.pupil.update({
    where: { id: input.pupilId },
    data: { birthDate: calendarDateFromIso(input.birthDate) },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.PUPIL,
    entityId: input.pupilId,
    action: AUDIT_ACTION.SCHOOL_PUPIL_BIRTHDATE_UPDATED,
    newValue: { fields: ["birthDate"] },
  });

  return { ok: true };
}

export async function updatePupilBirthDate(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = updatePupilBirthDateInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const todayIso = isoTodayUtc();

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return updatePupilBirthDateInTransaction(tx, actorUserId, organizationId, parsed.data, todayIso);
  });
}
